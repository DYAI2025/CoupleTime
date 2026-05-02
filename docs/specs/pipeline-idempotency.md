# Pipeline Idempotency Spec — VibeMind

Resolves [C5] from the design code-review.

## Why

Re-running stages must be cheap. Three concrete scenarios drive this:

1. **"Summary neu generieren" after corrections.** User reassigns a few speakers, splits a turn, edits some text. They click regenerate. The expensive Deepgram call must NOT re-run; only the LLM-summary stage should fire, with the corrected transcript as input.
2. **Worker crash mid-pipeline.** `vibemind-worker` dies on stage 2 of 3. On restart, the orphan stage-2 job resets to `pending` (see `job-queue.md`). Re-running stage 2 must produce the same output without re-doing stage 1.
3. **Manual re-trigger from CLI for debugging.** Operator runs `vibemind admin reprocess-session <id>`; the system should reuse cached outputs where available and only re-do explicitly invalidated stages.

Without idempotency keys, every re-run pays full Deepgram + LLM cost and forces the user to wait through the full pipeline again.

## Stages and their cache keys

| Stage | Input | Cache Key | Cached Output |
|---|---|---|---|
| Transcription + Diarization | audio file | `sha256(audio_bytes)` | `{ transcript_words, diarization_turns }` |
| Speaker Mapping | transcript + diarization + phase_timeline | `sha256(audio_sha256 ‖ phase_timeline_json)` | `{ final_turns, mapping_table }` |
| Summary | final_turns + correction_state + prompt_version | `sha256(speaker_mapping_key ‖ correction_state_json ‖ prompt_version)` | `{ markdown_text, model_used, generated_at }` |

`‖` denotes string concatenation.

`correction_state_json` is a stable JSON serialization of:
- speaker reassignments (`turn_id → new_speaker`)
- turn splits (`turn_id → [split_at_ms, ...]`)
- text edits (`turn_id → corrected_text`)

Sorted by `turn_id` to ensure stable hashing across runs.

`prompt_version` is a string baked into the code (e.g. `"v1.0-universal-summary"`). Bumping it invalidates all cached summaries and forces re-generation. Useful when iterating on prompt engineering.

## Storage

Three tables, mirroring the three stages:

```python
class TranscriptionCache(Base):
    __tablename__ = "transcription_cache"
    cache_key: Mapped[str] = mapped_column(String(64), primary_key=True)  # sha256 of audio
    transcript_words_json: Mapped[str]
    diarization_turns_json: Mapped[str]
    provider: Mapped[str]                # "deepgram" | "self-host" (future)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

class SpeakerMappingCache(Base):
    __tablename__ = "speaker_mapping_cache"
    cache_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    final_turns_json: Mapped[str]
    mapping_table_json: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

class SummaryCache(Base):
    __tablename__ = "summary_cache"
    cache_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), index=True)
    markdown_text: Mapped[str]
    model_used: Mapped[str]
    prompt_version: Mapped[str]
    generated_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

`SummaryCache` keeps `session_id` as a column so the Review UI can list all summary versions for a session (the user said: keep all versions). `transcription_cache` and `speaker_mapping_cache` don't need that column — same audio + same correction state always produces the same key.

Audio files themselves remain at `/var/vibemind/audio/{session_id}.opus`. **No** keying by `audio_sha256` for the file path — keep `session_id` as the primary path identifier so deletes / disk inspection are obvious. Lookup by hash goes through `TranscriptionCache.cache_key`.

## Worker behavior on incoming job

```python
async def run_stage(job):
    cache_key = compute_cache_key(job)

    if not job.payload_json.get("force_recompute"):
        cached = await cache_get(job.stage, cache_key)
        if cached is not None:
            await mark_completed(job, result=cached)
            return

    result = await dispatch_real_work(job)   # Deepgram, mapping algorithm, or LLM call
    await cache_put(job.stage, cache_key, result)
    await mark_completed(job, result=result)
```

`force_recompute=True` is set when the operator triggers a manual replay or when `prompt_version` is bumped. Without it, cache hits are instant (a single SQLite SELECT, ~1 ms).

## "Summary neu generieren" flow

1. User opens Review UI, makes corrections (speaker reassignments, splits, text edits).
2. Frontend tracks corrections in component state.
3. User clicks **"Zusammenfassung neu generieren"**.
4. Frontend POSTs:
   ```
   POST /api/sessions/{id}/summary/regenerate
   Body: { "correction_state": {...} }
   ```
5. Backend:
   ```python
   correction_hash = sha256(canonical_json(correction_state))
   summary_key = sha256(speaker_mapping_key + correction_hash + PROMPT_VERSION)
   cached = await cache_get("summary", summary_key)
   if cached:
       return cached  # instant — they made the same correction twice
   else:
       enqueue_job(stage="summary", session_id=id,
                   payload={"correction_state": correction_state})
       return {"status": "queued", "job_id": ...}
   ```
6. Worker picks up the summary job, hits the LLM cascade, writes to `SummaryCache`, marks job complete.
7. Frontend polls `/api/sessions/{id}/summary/latest` and shows new version when ready. Old versions remain accessible via a "Verlauf" dropdown.

**Key property:** Stages 1 (Deepgram) and 2 (speaker mapping) **never re-run** during this flow, regardless of how many times the user regenerates. Cost on regenerate = one LLM call (~$0.007 worst-case if cascade falls all the way through).

## What changes invalidate which caches

| User action | Invalidates |
|---|---|
| Re-upload same audio (rare; e.g. testing) | nothing — `audio_sha256` matches, all caches hit |
| Speaker reassignment | only summary cache (correction_state changed) |
| Turn split | only summary cache |
| Text edit | only summary cache |
| Phase-timeline correction (user fixes timer-export error) | speaker-mapping cache + summary cache |
| Re-run with different LLM model pinned via Settings | nothing — but the summary key includes `model_used` if we want different keys per model. **Decision for MVP: don't include model in key**, treat the cascade as opaque — the user-visible "Regenerate" always tries the cascade fresh. If you want a specific model again, use the per-session "Force LLM model" Settings override, which sets `force_recompute=True`. |
| Bump `PROMPT_VERSION` constant | all summary caches (every summary regenerates on next request) |
| Force-recompute via admin CLI | the specified stage + all downstream |

## Cleanup policy

- `TranscriptionCache` and `SpeakerMappingCache`: never auto-deleted. They're keyed by content hash; if the same content shows up again later, we want the hit. Storage cost is negligible (~10 KB per session for transcript JSON).
- `SummaryCache`: never auto-deleted. User explicitly stated: keep all summary versions.
- `Job` table rows older than 30 days with `status = "completed"` get archived (delete from main table, append to `jobs_archive` for audit). Reduces table-scan cost for the worker poll. Implemented as a daily cron after MVP launch.

## Test plan

```python
def test_cache_key_stable_across_runs(): ...  # same inputs → same key
def test_cache_key_changes_with_correction_state(): ...
def test_cache_key_changes_with_prompt_version_bump(): ...
def test_cached_stage_is_instant(): ...  # no real LLM call, < 100ms
def test_force_recompute_bypasses_cache(): ...
def test_regenerate_summary_only_calls_llm_not_deepgram(): ...
def test_canonical_correction_json_is_order_independent(): ...
def test_summary_versions_accumulate_per_session(): ...  # all versions kept
```

Integration: enqueue same job twice in the worker; second one completes in < 100ms via cache hit, no external API call.

## Open questions deferred

- **TranscriptionCache TTL** — should we auto-delete cached transcripts after audio is deleted (when audio-retention-policy ships post-MVP)? Privacy-favorable; perf-trivial. Decide when retention UI ships.
- **Cross-session cache sharing** — if two sessions happen to have bit-identical audio (e.g. test fixtures), they share the cache row. Currently fine. Becomes a multi-tenancy concern later.

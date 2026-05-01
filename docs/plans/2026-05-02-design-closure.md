# Design Closure & Remediation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the 2 blockers and 5 concerns surfaced in the code-review of the VibeMind/CoupleTimer MVP brainstorm, producing concrete research findings and design specs that the upcoming MVP.md can fold in without hand-waving.

**Architecture:** Phase-0 remediation. No production code written. Each task yields one of three artifact kinds: (a) a verified data point in a research doc, (b) a tightly-scoped design spec snippet, or (c) a small project-skeleton change. The next plan (post-MVP.md) handles real implementation.

**Tech Stack:** Markdown only for docs. `curl` + `jq` for OpenRouter API verification. `git` for commits. No runtime touched.

**Source for what is being remediated:** `MVP.md` doesn't exist yet — Section 1 is approved in the brainstorm transcript. The remaining design content surfaced as decisions through Q1–Q7 in the brainstorm + the code-review critique. Items addressed below are referenced by the IDs from that critique: **[B1]**, **[B2]**, **[C1]**–**[C5]**.

**Out of scope:** Writing MVP.md itself. Implementing any backend, frontend, or pipeline code. Deployment.

---

## Task 1: Create research-doc directories

**Files:**
- Create: `docs/research/.gitkeep`
- Create: `docs/specs/.gitkeep`

**Step 1: Create the directories**

```bash
mkdir -p /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/research
mkdir -p /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/specs
touch /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/research/.gitkeep
touch /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/specs/.gitkeep
```

**Step 2: Verify**

```bash
ls /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/research /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/specs
```
Expected: both dirs exist with `.gitkeep`.

**Step 3: Commit**

```bash
git add docs/research/.gitkeep docs/specs/.gitkeep
git commit -m "chore: scaffold docs/research and docs/specs"
```

---

## Task 2: Verify OpenRouter model availability — addresses [B2]

**Files:**
- Create: `docs/research/2026-05-02-openrouter-models.md`

**Step 1: Fetch OpenRouter models catalog**

Run:
```bash
curl -s https://openrouter.ai/api/v1/models | jq '.data[] | {id, pricing: .pricing.prompt, context: .context_length}' > /tmp/openrouter-models.json
wc -l /tmp/openrouter-models.json
```
Expected: hundreds of model entries.

**Step 2: Search for the three nominated free slugs**

Run each query and record the result:
```bash
jq '.data[] | select(.id | test("nemotron"; "i"))' < <(curl -s https://openrouter.ai/api/v1/models)
jq '.data[] | select(.id | test("hermes-3"; "i"))' < <(curl -s https://openrouter.ai/api/v1/models)
jq '.data[] | select(.id | test("gpt-oss"; "i"))' < <(curl -s https://openrouter.ai/api/v1/models)
jq '.data[] | select(.id | test("gemma"; "i"))' < <(curl -s https://openrouter.ai/api/v1/models)
```

For each: record (a) does the exact `:free` variant exist, (b) what is the closest available slug, (c) reported context length, (d) reported per-token price (free tier = `0`).

**Step 3: Document findings**

Write `docs/research/2026-05-02-openrouter-models.md` with this template:

```markdown
# OpenRouter Model Verification — 2026-05-02

## Nominated free models (from brainstorm Q1)

### nvidia/nemotron-3-nano-30b-a3b:free
- Status: [verified | not-found | renamed]
- Closest match: `<actual-slug>`
- Context length: <N> tokens
- Pricing: free / $X per 1M
- Notes: [rate-limit observed, last-updated]

### nousresearch/hermes-3-llama-3.1-405b:free
- (same shape)

### openai/gpt-oss-120b:free
- (same shape)

### gemma4:e2b (intended local fallback)
- Likely user meant: <gemma-3-2b-it | gemma-3-4b-it | other>
- OpenRouter availability: yes/no
- Ollama availability: yes/no — `ollama pull <name>`

## Free-tier rate-limit reality
[summary of OpenRouter free-tier policy as of today: per-model daily caps, BYOK exceptions, etc.]

## Recommended cascade (after this verification)
1. <slug-1> (free)
2. <slug-2> (free)
3. <slug-3> (free)
4. <paid-fallback>  ← see Task 3
5. <local Ollama>   ← see Task 4
```

**Step 4: Commit**

```bash
git add docs/research/2026-05-02-openrouter-models.md
git commit -m "research: verify OpenRouter model slugs for VibeMind cascade"
```

---

## Task 3: Decide paid-fallback model — addresses [B1]

**Files:**
- Modify: `docs/research/2026-05-02-openrouter-models.md` (append "Paid Fallback Decision" section)

**Step 1: Compile candidate paid models**

Pick from these with rationale documented:

- `openai/gpt-4o-mini` — ~$0.15/1M input, ~$0.60/1M output, ~128k context, fast, very capable
- `anthropic/claude-haiku-4-5` — ~$0.80/1M input, ~$4/1M output, 200k context, strong instruction-following
- `google/gemini-2.5-flash` — ~$0.075/1M input, ~$0.30/1M output, 1M context, cheapest serious option
- `deepseek/deepseek-chat-v3` — ~$0.14/1M input, ~$0.28/1M output, decent on multilingual

**Step 2: Estimate cost per session**

A 60-min Zwiegespräch produces ~6k–10k tokens of transcript. Summary prompt ~500 tokens. Output ~1.5k tokens.

Compute per-session cost for each candidate. Document.

**Step 3: Pick one based on (cost × capability × German-quality)**

Recommended default unless user overrides: **`google/gemini-2.5-flash`** (cheapest, 1M context comfortably handles full transcripts, German is solid).

**Step 4: Append decision section to the research doc**

```markdown
## Paid-fallback decision (resolves [B1])

**Pick:** `<chosen-slug>`
**Rationale:** <2 sentences>
**Per-session cost estimate:** <€/session>
**Position in cascade:** Step 4 (after the three free models, before local Ollama).
```

**Step 5: Commit**

```bash
git add docs/research/2026-05-02-openrouter-models.md
git commit -m "research: pick paid-fallback model for LLM cascade"
```

---

## Task 4: Decide local-fallback model — completes [B2]

**Files:**
- Modify: `docs/research/2026-05-02-openrouter-models.md` (append "Local Fallback Decision" section)

**Step 1: Verify Ollama-available Gemma variants**

Run (if Ollama installed locally):
```bash
ollama search gemma 2>/dev/null || curl -s https://registry.ollama.ai/v2/_catalog | jq .
```

Record exact tag user can `ollama pull`.

**Step 2: Test prompt-fit on KVM 2 (8 GB RAM, 2 vCPU)**

Constraints to verify in doc:
- Model size in RAM (Q4 quantized)
- Inference speed for ~8k input tokens (rough tokens/sec on 2 vCPU)
- Whether the model handles German competently for summarization

Recommended sizing for KVM 2: 2B–4B parameter models in Q4_K_M quantization. Anything ≥7B will OOM.

**Step 3: Pick one**

Likely candidates:
- `gemma3:2b` (~1.5 GB RAM, fastest)
- `gemma3:4b-it-qat` (~3 GB RAM, better quality)
- `qwen3:4b` (~3 GB, strong on multilingual)

**Step 4: Append decision section**

```markdown
## Local-fallback decision (resolves remaining part of [B2])

**Pick:** `<exact-ollama-tag>`
**Why this and not "gemma4:e2b":** <one sentence — that slug doesn't exist as a chat model on Ollama / OpenRouter as of 2026-05-02; closest match is X>
**RAM footprint on KVM 2:** <N GB Q4_K_M>
**Position in cascade:** Step 5 (last resort if all OpenRouter options fail).
**Trigger condition:** OpenRouter cascade returns 4xx/5xx for all four steps OR network to OpenRouter unreachable.
```

**Step 5: Commit**

```bash
git add docs/research/2026-05-02-openrouter-models.md
git commit -m "research: pick local Ollama fallback model"
```

---

## Task 5: Spec persistent job queue — addresses [C1]

**Files:**
- Create: `docs/specs/job-queue.md`

**Step 1: Author spec**

Content to write:

```markdown
# Persistent Job Queue Spec — VibeMind

## Why
FastAPI `BackgroundTasks` does not survive process restart. A 5-minute pipeline interrupted by uvicorn restart leaves the session orphaned. We need a persistent queue that survives restart and can resume in-flight work.

## Schema (SQLite via SQLAlchemy)

\`\`\`python
class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    stage: Mapped[str]           # "transcription" | "diarization" | "merge" | "summary"
    status: Mapped[str]          # "pending" | "running" | "completed" | "failed"
    attempts: Mapped[int] = mapped_column(default=0)
    max_attempts: Mapped[int] = mapped_column(default=3)
    payload_json: Mapped[str]    # stage-specific input
    result_json: Mapped[str | None]
    error_text: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    started_at: Mapped[datetime | None]
    completed_at: Mapped[datetime | None]
    next_retry_at: Mapped[datetime | None]
\`\`\`

## Worker process
A second long-running Python process (separate from uvicorn) polls `jobs` every 5 sec for the oldest `pending` row whose `next_retry_at IS NULL OR next_retry_at <= now()`. Claims by atomic `UPDATE ... WHERE status = 'pending' RETURNING *` (SQLite supports `RETURNING` since 3.35).

## Retry strategy
Failure → `attempts++`, `next_retry_at = now + (2 ** attempts) seconds` (exponential backoff: 2s, 4s, 8s). After `attempts >= max_attempts` → `status = "failed"`, surface in UI as "Verarbeitung fehlgeschlagen — bitte erneut starten".

## Idempotency hook
See `docs/specs/pipeline-idempotency.md` (Task 9). Each stage checks for an existing successful job for the same input-hash before doing real work.

## Process layout
- `apps/backend/vibemind/web.py` — FastAPI, handles HTTP requests, enqueues jobs, returns immediately.
- `apps/backend/vibemind/worker.py` — long-running poll loop. Run via systemd unit on Hostinger KVM 2.

## Why not Redis / arq / dramatiq
Redis adds a service to deploy on a 2-vCPU box. Single-user MVP doesn't need parallel workers. SQLite + RETURNING is sufficient and one less moving part.
```

**Step 2: Commit**

```bash
git add docs/specs/job-queue.md
git commit -m "spec: persistent job queue (SQLite + RETURNING)"
```

---

## Task 6: Spec resumable upload — addresses [C2]

**Files:**
- Create: `docs/specs/resumable-upload.md`

**Step 1: Author spec**

Content to write:

```markdown
# Resumable Audio Upload Spec — VibeMind

## Why
A 50 MB single PUT over flaky WiFi (typical home environment) fails ~5% of the time. For an investor demo, a single upload-failure ruins the moment. We need chunked-with-retry.

## Protocol — pragmatic (not full tus.io)

### Frontend (CoupleTimer)
1. After session ends and audio blob is finalized, split into 1 MB chunks.
2. Issue `POST /api/sessions` to register the session (server returns `session_id` and `upload_id`).
3. For each chunk, issue:

   \`\`\`
   PUT /api/sessions/{session_id}/audio
   Headers:
     Content-Range: bytes <start>-<end>/<total>
     X-Upload-Id: <upload_id>
     X-Chunk-Index: <i>
   Body: <chunk-bytes>
   \`\`\`

4. On 4xx/5xx or network error: exponential backoff (1s, 2s, 4s, 8s), max 4 retries per chunk.
5. After last chunk: `POST /api/sessions/{session_id}/audio/finalize` with body `{ "total_chunks": N, "sha256": "..." }`.

### Backend (FastAPI)
- `POST /api/sessions` — creates DB row, allocates `upload_id`, returns IDs.
- `PUT /api/sessions/{id}/audio` — appends chunk to `/var/vibemind/uploads/{upload_id}.partial`. Validates `Content-Range` matches expected next-byte offset. 409 Conflict on out-of-order chunk.
- `POST /api/sessions/{id}/audio/finalize` — verifies SHA256, renames `.partial` → `.opus`, enqueues transcription job.

### Resume after page reload (stretch)
The IndexedDB-backed audio blob is still on the user's device. If we persist `upload_id` + last-acked-chunk-index in LocalStorage, the user can resume after reload. **MVP: not required** — but the protocol above supports it without changes.

## What this is not
- Not full tus.io (we don't need protocol negotiation, multiple upload endpoints, or third-party tus servers).
- Not WebSocket (HTTP/2 multiplexing is enough for 1 MB chunks).

## Test plan
- Unit: chunk-merge correctness, SHA256 verification.
- Integration: simulate dropped connection mid-upload, verify resume picks up at the right byte offset.
- Manual: throttle WiFi to 3G in DevTools, upload a 50 MB file, verify it completes.
```

**Step 2: Commit**

```bash
git add docs/specs/resumable-upload.md
git commit -m "spec: chunked resumable audio upload"
```

---

## Task 7: Spec speaker-mapping decision rules — addresses [C3]

**Files:**
- Create: `docs/specs/speaker-mapping.md`

**Step 1: Author spec**

Content to write:

```markdown
# Speaker Mapping Decision Rules — VibeMind

## Inputs
- `phase_timeline: List[{phase_type, expected_speaker: "A" | "B" | None, start_ms, end_ms}]` (from CoupleTimer)
- `diarization_turns: List[{diarized_speaker_id, start_ms, end_ms, confidence}]` (from Deepgram or pyannote)

## Output
- `speaker_mapping: Dict[diarized_speaker_id → "A" | "B" | "unknown"]`
- `final_turns: List[{start_ms, end_ms, speaker: "A" | "B" | "unknown", source: "diarization" | "timer" | "fallback"}]`

## Algorithm

### Step 1 — Count diarized speakers
\`\`\`
n = len(set(turn.diarized_speaker_id for turn in diarization_turns))
\`\`\`

### Step 2 — Branch by speaker count

**Case n == 1 (only one voice detected):**
- Acoustic separation failed (mono mic, very quiet partner, etc).
- Map the single diarized speaker → `"A"` arbitrarily.
- All `final_turns` use `source = "timer"`: speaker derived from phase_timeline.expected_speaker only.
- Mark mapping with `confidence = "low"`.

**Case n == 2 (the happy path):**
- For each diarized speaker, compute total overlap-time with slotA-phases vs slotB-phases.
- Map by majority: `speaker_X → "A"` if overlap_with_A > overlap_with_B, else `"B"`.
- **Tie-break (within 10% of total)**: use phase-position — the speaker active in the FIRST slotA phase becomes `"A"`.
- For each diarized turn, set `source = "diarization"` if confidence ≥ 0.7 AND phase-consistency holds (turn falls within the expected speaker's slot, OR confident enough to override). Otherwise `source = "timer"` and use the phase's expected_speaker.

**Case n >= 3 (extra voices in the room):**
- Pick top 2 diarized speakers by total speaking time → map them as in Case n == 2.
- All other diarized speakers → mapped to `"unknown"`.
- Their turns are still recorded but flagged for manual review.

### Step 3 — Confidence threshold for diarization-override
A diarization turn overrides the timer-prior only when:
- `turn.confidence >= 0.7` AND
- `phase-overlap-asymmetry > 0.7` (the diarized speaker spends > 70% of their total time in one of A's or B's slots).

When both conditions hold, the turn is attributed by diarization even if it falls inside the "wrong" timer slot (this is how interjections during slotA get correctly attributed to B).

When either condition fails, fall back to timer-prior for that turn.

## Edge cases handled

| Situation | Behavior |
|---|---|
| Silence in a slot | No diarization turn → no transcript turn → not in output. |
| Long overlap (both speak simultaneously) | Diarization usually emits two overlapping turns; merge logic keeps both with their respective speakers. |
| Mid-slot speaker swap (B interrupts A) | Confidence + asymmetry threshold catches this if the interjection is long enough. |
| Recording starts before phase_timeline starts (clock-skew between MediaRecorder and SessionEngine) | Turns before phase_timeline[0].start_ms → `speaker = "unknown", source = "fallback"`. |
| n == 1 but timer says both should have spoken | Mapping is best-effort; user can manually fix in review UI. |

## Test plan
- Unit: 6 fixtures covering each case above; assert `final_turns` shape.
- Integration: feed real Deepgram output for a recorded test session; eyeball results.
- Manual: investor-demo dry-run, verify speaker-attribution looks right on a real conversation with planned interjections.
```

**Step 2: Commit**

```bash
git add docs/specs/speaker-mapping.md
git commit -m "spec: speaker-mapping decision rules with edge cases"
```

---

## Task 8: Spec privacy data flow — addresses [C4]

**Files:**
- Create: `docs/specs/privacy-data-flow.md`

**Step 1: Author spec**

Content to write:

```markdown
# Privacy Data Flow — VibeMind MVP

## Honest disclosure (will appear verbatim in MVP.md and the in-app onboarding)

The user previously stated as a privacy goal: *"Audio/Transkripte sollen im Tool / auf dem VPS verarbeitet werden."* The MVP architecture **does not fully meet that goal** because it depends on third-party Cloud APIs for transcription and LLM inference. This trade-off is intentional (cost, demo latency, KVM 2 capacity) and must be disclosed.

## Where data goes

| Data | Destination | Stored where | Retention | Purpose |
|---|---|---|---|---|
| Recorded audio (OPUS) | Hostinger VPS `/var/vibemind/audio/` | KVM 2 disk | permanent (user-deletable later) | source of truth |
| Audio (full) | Deepgram (US-East/EU TBD) | Deepgram processing infra | per Deepgram retention policy (default: deleted after processing unless retention enabled) | transcription + diarization |
| Transcript text | OpenRouter → selected model provider | provider infra | per provider policy (varies; OpenRouter aggregates logs unless BYOK + opt-out) | LLM summary |
| Speaker corrections, summary versions | Hostinger VPS SQLite | KVM 2 disk | permanent | user history |
| API key (`VITE_VIBEMIND_API_KEY`) | shipped in JS bundle | user's browser | until rotation | request auth |

## What stays on the VPS only
- All persisted state (sessions, transcripts, summaries, mappings).
- All audio files post-processing.
- All user corrections and version history.

## What leaves the VPS
- Audio uploads to Deepgram (full audio per session).
- Transcript text to OpenRouter (every summary regeneration sends the corrected transcript again).

## Mitigations included in MVP
- Deepgram: enable "do not retain" flag where supported.
- OpenRouter: prefer providers with no-logging policies in the cascade ranking.
- Local Ollama fallback exists — power-user can flip a per-session toggle to keep summary inference local (slow but private).

## Mitigations deferred (post-MVP)
- Self-hosted Whisper + pyannote on a separate GPU box → audio never leaves user infra.
- End-to-end client-side encryption of audio at rest.

## Wording for in-app disclosure (Settings → Privacy)
> Diese App nutzt für Transkription (Deepgram, USA) und Zusammenfassung (OpenRouter) externe Cloud-Dienste. Audio und Transkript verlassen dabei den eigenen Server. Wenn du das nicht möchtest, schalte in den Einstellungen den "Lokale Verarbeitung"-Modus an — die Zusammenfassung läuft dann auf dem eigenen Server (langsamer). Die Aufnahme selbst bleibt immer auf dem eigenen Server gespeichert.
```

**Step 2: Commit**

```bash
git add docs/specs/privacy-data-flow.md
git commit -m "spec: honest privacy data-flow disclosure"
```

---

## Task 9: Spec pipeline idempotency — addresses [C5]

**Files:**
- Create: `docs/specs/pipeline-idempotency.md`

**Step 1: Author spec**

Content to write:

```markdown
# Pipeline Idempotency Spec — VibeMind

## Why
"Summary neu generieren" must not re-run transcription. Re-running speaker corrections must not re-call Deepgram. Each pipeline stage needs an idempotency key so re-execution is cheap.

## Stages and their cache keys

| Stage | Input | Cache Key | Output |
|---|---|---|---|
| Transcription | audio file | `sha256(audio_bytes)` | `transcript.json` (turns with timestamps) |
| Diarization | audio file | `sha256(audio_bytes)` | `diarization.json` (turns with diarized speaker ids) |
| Speaker mapping | transcript + diarization + phase_timeline | `sha256(transcript_id + diarization_id + phase_timeline_hash)` | `final_turns.json` |
| Summary | final_turns + correction_state + prompt_version | `sha256(final_turns_id + correction_state_hash + prompt_version)` | `summary_v<N>.md` |

`correction_state_hash` covers: speaker reassignments, turn splits, text edits. Any change to corrections invalidates summary cache for that session, but transcription/diarization are still reused.

## Storage
- `transcripts/{audio_sha256}.json`
- `diarizations/{audio_sha256}.json`
- `mappings/{mapping_sha256}.json`
- `summaries/{summary_sha256}.md` (also row in `summary_versions` table linked to session_id)

## Worker behavior on incoming job
\`\`\`python
def run_stage(job):
    cache_key = compute_cache_key(job)
    cached = cache.get(cache_key)
    if cached and not job.force_recompute:
        job.result = cached
        job.status = "completed"
        return
    cached = do_real_work(job)
    cache.put(cache_key, cached)
    job.result = cached
    job.status = "completed"
\`\`\`

## "Regenerate summary" flow
1. User clicks button in Review UI after editing.
2. Frontend POSTs `/api/sessions/{id}/summary/regenerate`.
3. Backend enqueues a `summary` job with current `correction_state_hash`.
4. Cache miss → LLM call → new summary version stored.
5. Frontend gets the new version and adds it to history list.

## Test plan
- Unit: cache key stability across runs (same inputs → same key).
- Integration: enqueue same job twice, second is instant.
- Integration: change correction state, verify summary recomputes but transcription doesn't.
```

**Step 2: Commit**

```bash
git add docs/specs/pipeline-idempotency.md
git commit -m "spec: pipeline idempotency with per-stage cache keys"
```

---

## Task 10: Spec monorepo skeleton & supporting decisions — captures Notes [N1]–[N7]

**Files:**
- Create: `docs/specs/monorepo-and-defaults.md`

**Step 1: Author spec**

Content to write:

```markdown
# Monorepo Layout & Configuration Defaults

## Target directory layout

\`\`\`
coupleTime/                   # repo root (existing)
├── apps/
│   ├── frontend/             # MOVE existing src/, public/, index.html, vite.config.ts here
│   └── backend/              # NEW — FastAPI service
│       ├── pyproject.toml
│       ├── vibemind/
│       │   ├── web.py        # FastAPI app
│       │   ├── worker.py     # job queue worker
│       │   ├── pipeline/
│       │   ├── providers/    # LLM cascade, transcription provider
│       │   ├── models.py     # SQLAlchemy
│       │   └── ...
│       └── tests/
├── docs/
│   ├── plans/
│   ├── research/
│   └── specs/
├── package.json              # workspaces root
├── MVP.md
├── CLAUDE.md
└── README.md
\`\`\`

## Tooling
- **Frontend:** unchanged (npm + Vite + Vitest + Playwright).
- **Backend:** `uv` for Python deps (`uv venv`, `uv sync`), `pyproject.toml` not `requirements.txt`. `pytest` + `pytest-asyncio` for tests. `ruff` for lint, `mypy` for types.
- **No Turborepo / Nx for now** — npm-workspaces is enough; backend tasks run independently from `apps/backend/`.

## Move plan (not executed in this plan; happens in implementation plan)
The migration from current flat layout to `apps/frontend/` is destructive and must be a single atomic commit:
1. Stop dev server.
2. `git mv` the eight top-level frontend files/dirs into `apps/frontend/`.
3. Update path-relative imports / configs only as needed.
4. Update `package.json` workspaces.
5. Re-run all tests; commit.

## Configuration defaults to lock in MVP.md

| Setting | Default |
|---|---|
| Audio format | OPUS, mono, 16 kHz, **32 kbps** |
| MediaRecorder timeslice | 1000 ms (one chunk per second to IndexedDB; final blob assembled at session-end) |
| SQLite mode | WAL with `busy_timeout = 5000`, `synchronous = NORMAL`, `cache_size = -64000` (~64 MB) |
| Backup | nightly cron `tar -czf` of `vibemind.db` + `audio/` → off-site (Backblaze B2 via `rclone`, ~6 €/TB/month) |
| CORS / Origin allowlist | env-driven `VIBEMIND_ALLOWED_ORIGINS=https://couples-timer.app` enforced in FastAPI middleware |
| Notification (MVP) | Toast in-app + tab-title update via polling. **No Web Push.** |
| Export formats | Markdown + TXT generated from same source. TXT = Markdown with headers stripped. **One generator function.** |
| Bitrate floor | reject (warn user) any source audio under 24 kbps — diarization quality drops sharply. |

## What's deferred
- Web Push (deferred to v1.1)
- Per-mode summary prompts (deferred — single universal prompt for MVP)
- PDF export (deferred)
- Cloud-share to Drive/Dropbox (deferred)
```

**Step 2: Commit**

```bash
git add docs/specs/monorepo-and-defaults.md
git commit -m "spec: monorepo layout and config defaults"
```

---

## Task 11: Cross-link index

**Files:**
- Create: `docs/specs/INDEX.md`

**Step 1: Write index**

```markdown
# VibeMind Design Specs Index

Every spec here resolves a specific issue surfaced in the 2026-05-02 code review of the brainstorm.

| ID | Spec | Resolves |
|---|---|---|
| — | [Privacy Data Flow](./privacy-data-flow.md) | [C4] |
| — | [Speaker Mapping](./speaker-mapping.md) | [C3] |
| — | [Resumable Upload](./resumable-upload.md) | [C2] |
| — | [Job Queue](./job-queue.md) | [C1] |
| — | [Pipeline Idempotency](./pipeline-idempotency.md) | [C5] |
| — | [Monorepo & Defaults](./monorepo-and-defaults.md) | [N1]–[N7] |

Research artifacts:
- [OpenRouter Models](../research/2026-05-02-openrouter-models.md) — resolves [B1] + [B2]

When MVP.md is authored (next phase), each section will reference these specs by relative link rather than restate them.
```

**Step 2: Commit**

```bash
git add docs/specs/INDEX.md
git commit -m "docs: index of VibeMind design specs"
```

---

## Task 12: Update brainstorm-state pointer

**Files:**
- Modify: this plan file (mark closure)

**Step 1: Verify all blockers/concerns produce artifacts**

Run:
```bash
ls /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/research /Users/benjaminpoersch/Projects/WEB/coupleTime/docs/specs
```
Expected output should include:
- `docs/research/2026-05-02-openrouter-models.md`
- `docs/specs/job-queue.md`
- `docs/specs/resumable-upload.md`
- `docs/specs/speaker-mapping.md`
- `docs/specs/privacy-data-flow.md`
- `docs/specs/pipeline-idempotency.md`
- `docs/specs/monorepo-and-defaults.md`
- `docs/specs/INDEX.md`

**Step 2: Verify mappings**

| ID | Resolved by | File |
|---|---|---|
| [B1] free-tier rate-limit risk | paid-fallback decision | `docs/research/2026-05-02-openrouter-models.md` |
| [B2] unverified model slugs | OpenRouter API verification + local Ollama tag | `docs/research/2026-05-02-openrouter-models.md` |
| [C1] persistent job queue | spec | `docs/specs/job-queue.md` |
| [C2] resumable upload | spec | `docs/specs/resumable-upload.md` |
| [C3] speaker mapping algorithm | spec | `docs/specs/speaker-mapping.md` |
| [C4] privacy disclosure | spec | `docs/specs/privacy-data-flow.md` |
| [C5] pipeline idempotency | spec | `docs/specs/pipeline-idempotency.md` |
| [N1]–[N7] | misc defaults | `docs/specs/monorepo-and-defaults.md` |

**Step 3: Final commit**

```bash
git status
git log --oneline -15
```

Verify all 11 commits from this plan are present in order. No further commit needed for this task.

---

## Out of scope (intentional)

- Writing MVP.md itself — happens in the next plan, after the brainstorm sections 2–8 are presented and approved.
- Implementing any of the above specs — that's the third plan.
- Moving the existing frontend to `apps/frontend/` — destructive, happens at the start of the implementation plan.
- Setting up Hostinger KVM 2 — deployment plan, later.

## Done criteria

All blockers and concerns from the 2026-05-02 code review have a written artifact under `docs/research/` or `docs/specs/` that the next planning phase can reference. No design hand-waving remains.

# Persistent Job Queue Spec — VibeMind

Resolves [C1] from the design code-review.

## Why

FastAPI `BackgroundTasks` does not survive process restart. A 5-minute pipeline interrupted by uvicorn restart (deploy, OOM, system reboot) leaves the session orphaned — no review screen ever appears for that audio. We need a persistent queue that:

- survives process restart and resumes in-flight work
- supports retry-with-backoff on transient failures (Deepgram 502, OpenRouter rate-limit, network blip)
- enforces idempotency per stage (see `pipeline-idempotency.md`)
- runs on a single-vCPU box without an extra service like Redis

## Schema (SQLite via SQLAlchemy)

```python
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, func

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), index=True)

    stage: Mapped[str] = mapped_column(String(32))
    # one of: "transcription_diarization" | "speaker_mapping" | "summary"

    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    # one of: "pending" | "running" | "completed" | "failed" | "cancelled"

    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3)

    payload_json: Mapped[dict] = mapped_column(JSON)
    # stage-specific input. Examples:
    # transcription: {"audio_path": "...", "language": "auto"}
    # summary:       {"final_turns_id": "...", "correction_state_hash": "..."}

    result_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_text: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)

    # idempotency cache key — see pipeline-idempotency.md
    cache_key: Mapped[str] = mapped_column(String(64), index=True)
```

Indexes: `(status, next_retry_at)` for the worker poll, `cache_key` for idempotency lookups.

## Worker process

A second long-running Python process (separate from `uvicorn`) polls `jobs` every 5 seconds. Single-worker for MVP — no concurrency, no contention.

```python
# vibemind/worker.py
async def run_worker():
    while True:
        job = await claim_next_job()
        if job is None:
            await asyncio.sleep(5)
            continue
        try:
            result = await dispatch_stage(job)
            await mark_completed(job, result)
        except RetriableError as e:
            await mark_for_retry(job, e)
        except Exception as e:
            await mark_failed(job, e)
```

### Atomic claim with `RETURNING`

SQLite supports `UPDATE ... RETURNING` since 3.35 (2021). Atomic claim avoids two workers picking the same job (defensive — we run a single worker, but cheap to do right):

```sql
UPDATE jobs
SET status = 'running',
    started_at = CURRENT_TIMESTAMP,
    attempts = attempts + 1
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending'
    AND (next_retry_at IS NULL OR next_retry_at <= CURRENT_TIMESTAMP)
  ORDER BY created_at
  LIMIT 1
)
RETURNING *;
```

## Retry strategy

On `RetriableError` (HTTP 5xx from a provider, network timeout, rate-limit 429):

```python
async def mark_for_retry(job, error):
    job.attempts += 1
    if job.attempts >= job.max_attempts:
        job.status = "failed"
        job.error_text = str(error)
        job.completed_at = now()
    else:
        delay = 2 ** job.attempts  # 2, 4, 8 seconds
        job.next_retry_at = now() + timedelta(seconds=delay)
        job.status = "pending"
        job.error_text = f"attempt {job.attempts} failed: {error}"
```

Failure semantics surfaced to UI: status `"failed"` produces a "Verarbeitung fehlgeschlagen — bitte erneut starten" message in the review-screen polling response, with a button to enqueue a fresh job (resets `attempts` to 0, new row).

## Pipeline graph

Three stages are enqueued in sequence per session. Each completion enqueues the next.

```
audio uploaded
    │
    ▼
┌─────────────────────────────┐
│ Stage 1: transcription_     │  Deepgram Nova-2 with diarization in one call
│           diarization       │  Output: { transcript_turns, diarization_turns }
└─────────────────┬───────────┘
                  │ on success
                  ▼
┌─────────────────────────────┐
│ Stage 2: speaker_mapping    │  Pure Python, no external API
│                             │  Reconciles timer-prior + diarization
│                             │  Output: { final_turns, mapping_table }
└─────────────────┬───────────┘
                  │ on success
                  ▼
┌─────────────────────────────┐
│ Stage 3: summary            │  OpenRouter cascade (capability-first)
│                             │  Output: { markdown_text, model_used }
└─────────────────────────────┘
```

If user clicks "Summary neu generieren" after corrections in the Review UI, only **Stage 3** is enqueued again — Stages 1 and 2 are cached by `pipeline-idempotency.md`.

## Process layout

| Process | Module | Role |
|---|---|---|
| `uvicorn vibemind.web:app` | `apps/backend/vibemind/web.py` | FastAPI, handles HTTP, enqueues jobs, returns immediately |
| `python -m vibemind.worker` | `apps/backend/vibemind/worker.py` | long-running poll loop, dispatches stages |

Both processes share the same SQLite database via WAL mode + `busy_timeout = 5000`. No concurrency primitives needed because the worker is a single process and writes are serialized through SQLite's default locking.

Run as systemd units on Hostinger KVM 2:
```ini
# /etc/systemd/system/vibemind-web.service
[Service]
ExecStart=/opt/vibemind/.venv/bin/uvicorn vibemind.web:app --host 127.0.0.1 --port 8000
Restart=always

# /etc/systemd/system/vibemind-worker.service
[Service]
ExecStart=/opt/vibemind/.venv/bin/python -m vibemind.worker
Restart=always
```

Crash recovery: `systemd Restart=always` brings either process back; in-flight jobs marked `running` longer than 30 minutes are reset to `pending` on worker startup (see "Crash recovery" below).

## Crash recovery

Worker startup hook:

```python
async def reset_stale_jobs():
    cutoff = now() - timedelta(minutes=30)
    await db.execute("""
        UPDATE jobs
        SET status = 'pending',
            started_at = NULL,
            error_text = 'reset after worker restart'
        WHERE status = 'running'
          AND started_at < :cutoff
    """, {"cutoff": cutoff})
```

30 minutes is conservative — longest realistic stage (Deepgram on a 90-min audio) is ~3 minutes. Anything older than 30 min is definitely an orphan.

## Why not Redis / arq / dramatiq

- **Redis** — adds a service to deploy on a 2-vCPU/8 GB box. Single-user MVP doesn't need parallel workers or pub/sub. One less moving part to fail.
- **arq** — nice library, but requires Redis.
- **dramatiq** — same.
- **Celery** — heavyweight, configuration-heavy, overkill.

SQLite + `RETURNING` + a 5-second poll loop is the right tool at this scale. Migrate to Redis-backed queues only if/when we hit > 1 concurrent session in flight, which won't happen in the single-user MVP.

## Test plan

| Layer | Test |
|---|---|
| Unit | `claim_next_job()` returns oldest pending row whose retry-time has passed |
| Unit | `mark_for_retry()` increments attempts, sets exponential `next_retry_at` |
| Unit | `mark_for_retry()` flips to `"failed"` after max_attempts |
| Integration | enqueue 3 jobs, run worker for 30 sec, verify all complete |
| Integration | inject a `RetriableError` on attempt 1, verify retry succeeds on attempt 2 |
| Integration | `reset_stale_jobs()` flips a hung `running` row back to `pending` |
| Integration | kill worker mid-stage, restart, verify the job resumes (re-runs the stage; idempotency layer cache-hits if applicable) |

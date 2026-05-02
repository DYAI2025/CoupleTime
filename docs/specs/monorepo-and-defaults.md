# Monorepo Layout & Configuration Defaults

Captures Notes [N1]–[N7] from the design code-review. These are the small but load-bearing defaults that the implementation plan will lock in without further discussion.

## Target directory layout

```
coupleTime/                              # repo root (existing)
├── apps/
│   ├── frontend/                        # MOVED from current top-level src/, public/, index.html, vite.config.ts, etc.
│   │   ├── src/                         # CoupleTimer React app (unchanged)
│   │   ├── public/
│   │   ├── e2e/                         # Playwright specs
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── playwright.config.ts
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   ├── vite.config.ts
│   │   └── vitest.config.ts
│   │
│   └── backend/                         # NEW — FastAPI service
│       ├── pyproject.toml
│       ├── uv.lock
│       ├── README.md
│       ├── alembic.ini
│       ├── alembic/                     # SQLite migrations (also valid path forward to Postgres)
│       ├── vibemind/
│       │   ├── __init__.py
│       │   ├── web.py                   # FastAPI app entrypoint
│       │   ├── worker.py                # job queue worker entrypoint
│       │   ├── settings.py              # pydantic-settings config
│       │   ├── db.py                    # SQLAlchemy engine + session
│       │   ├── models.py                # Session, Upload, Job, *Cache, etc.
│       │   ├── schemas.py               # pydantic request/response models
│       │   ├── auth.py                  # API-key middleware
│       │   ├── pipeline/
│       │   │   ├── transcription.py     # Stage 1
│       │   │   ├── speaker_mapping.py   # Stage 2 (algorithm from speaker-mapping.md)
│       │   │   └── summary.py           # Stage 3
│       │   ├── providers/
│       │   │   ├── transcription.py     # Deepgram client (single-impl interface)
│       │   │   ├── llm.py               # OpenRouter cascade + Ollama fallback
│       │   │   └── prompts/
│       │   │       └── universal_v1.txt # PROMPT_VERSION = "v1.0-universal-summary"
│       │   ├── routes/
│       │   │   ├── sessions.py
│       │   │   ├── audio.py
│       │   │   ├── summary.py
│       │   │   └── status.py
│       │   └── workers/
│       │       └── stages.py            # job-stage dispatch
│       └── tests/
│           ├── unit/
│           ├── integration/
│           └── fixtures/
│
├── docs/
│   ├── plans/
│   ├── research/
│   └── specs/                           # this file lives here
│
├── package.json                         # workspaces root (npm workspaces)
├── MVP.md                               # to be written after the brainstorm
├── CLAUDE.md
└── README.md
```

## Tooling

| Layer | Tool | Why |
|---|---|---|
| Frontend dep mgmt | npm + workspaces | unchanged from existing repo |
| Frontend build | Vite 7 | unchanged |
| Frontend test | Vitest 4 (unit) + Playwright (E2E) | unchanged |
| Backend dep mgmt | **uv** (`uv venv`, `uv sync`, `uv run`) | fastest Python deps, lockfile-aware, much smaller than poetry |
| Backend deps declared in | `pyproject.toml` | not `requirements.txt` — modern standard |
| Backend test | `pytest` + `pytest-asyncio` | de-facto Python standard |
| Backend lint | `ruff` (lint + format combined) | replaces black + isort + flake8 |
| Backend types | `mypy --strict` on `vibemind/` | catch bugs early |
| Backend migrations | `alembic` | works with SQLite now, with Postgres later if we migrate |
| Process mgmt (prod) | `systemd` units on Hostinger KVM 2 | already specified in `job-queue.md` |
| Process mgmt (dev) | `make dev` runs both `uvicorn` and `worker` via `concurrently` | one-command bring-up |

**No Turborepo / Nx / Bazel.** TypeScript and Python tooling don't share infrastructure well; npm workspaces handles the JS side, and the backend lives in its own world via `uv`. Cross-cutting commands documented in a root `Makefile`:

```makefile
# Makefile (root)
.PHONY: dev test lint format

dev:
	cd apps/frontend && npm run dev &
	cd apps/backend && uv run uvicorn vibemind.web:app --reload &
	cd apps/backend && uv run python -m vibemind.worker &
	wait

test:
	cd apps/frontend && npm run test:run
	cd apps/backend && uv run pytest

lint:
	cd apps/frontend && npm run lint
	cd apps/backend && uv run ruff check .

format:
	cd apps/frontend && npm run format
	cd apps/backend && uv run ruff format .
```

## Move plan (executed in the implementation plan, not this plan)

The migration from current flat layout to `apps/frontend/` is destructive and must be a single atomic commit. Sequence to be executed later:

1. Stop dev server.
2. `mkdir -p apps/frontend`
3. `git mv` the eight top-level frontend files/dirs (`src/`, `public/`, `e2e/`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `postcss.config.js`, `playwright.config.ts`, `package.json`, `package-lock.json`, `eslint.config.js`) into `apps/frontend/`.
4. Update root `package.json` to declare workspaces: `"workspaces": ["apps/*"]`.
5. Verify Vite build still works (`base: './'` is unaffected by the move).
6. Verify Playwright still finds `e2e/` (paths in `playwright.config.ts` are relative to the config, so should just work).
7. Run all tests; commit as one atomic change.
8. Update CI (`.github/workflows/`) to `cd apps/frontend && npm ci && npm run build` etc.

## Configuration defaults to lock

These are the small decisions that get hand-waved away if not pinned. Decision = these values until explicitly overridden.

### Audio

| Setting | Default | Rationale |
|---|---|---|
| Codec | OPUS | modern, royalty-free, designed for speech |
| Channels | mono | partner conversation, no stereo benefit, halves bandwidth |
| Sample rate | 16 kHz | speech-grade; Whisper trained on 16 kHz |
| Bitrate | 32 kbps | speech sweet spot; below 24 kbps damages diarization |
| MIME type | `audio/webm;codecs=opus` (browser support) | recoded server-side to `.opus` if needed |
| `MediaRecorder.timeslice` | 1000 ms | one chunk/sec to IndexedDB; full Blob assembled at session-end |
| Source bitrate floor | reject < 24 kbps with user warning | sub-spec quality kills downstream accuracy |

### SQLite

| Setting | Default | Rationale |
|---|---|---|
| `journal_mode` | WAL | concurrent reads while writing |
| `busy_timeout` | 5000 (ms) | tolerate brief lock contention |
| `synchronous` | NORMAL | safe with WAL, ~5× faster than FULL |
| `cache_size` | -64000 (~64 MB) | enough for working set without RAM pressure |
| `foreign_keys` | ON | enforce FK constraints (off by default in SQLite!) |

Applied via `PRAGMA` statements at connection startup in `vibemind/db.py`.

### Backup

| Setting | Default |
|---|---|
| Frequency | nightly via cron at 03:00 |
| Source | `vibemind.db` + `audio/*.opus` |
| Format | `tar -czf` |
| Destination | **off-site** to Backblaze B2 via `rclone` (~6 €/TB/month) |
| Local copy | last 3 nights kept on KVM 2 disk for fast restore |
| Retention off-site | last 30 days |
| Restore drill | quarterly — must run `rclone copy` of latest backup, restore to a scratch dir, verify SHA256 of audio files |

Backblaze B2 specifically because: cheapest cloud-storage in this class, zero-egress-fee for restoration, no minimum commitment. Setup is one config file in `rclone`.

### CORS / Origin

```python
# In vibemind/web.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # env: VIBEMIND_ALLOWED_ORIGINS, e.g. "https://couples-timer.app"
    allow_credentials=False,                 # API-key auth, no cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-API-Key", "X-Upload-Id", "X-Chunk-Index", "Content-Range"],
)
```

`VIBEMIND_ALLOWED_ORIGINS` is comma-separated. Production: `https://couples-timer.app`. Local dev: also include `http://localhost:5173`.

### Notification (MVP)

- **No Web Push.**
- After session-end and during processing, frontend polls `GET /api/sessions/{id}/status` every 3 seconds while the tab is foreground, every 30 seconds while backgrounded.
- Tab title updates: `"Verarbeitung läuft… — CoupleTimer"` while running, `"✓ Bereit — CoupleTimer"` when complete (gets the user's attention via the pinned-tab favicon).
- Web Push deferred to v1.1 (requires service worker + VAPID keys + push-subscription DB table).

### Export

- **One generator function** in `vibemind/pipeline/export.py`:
  ```python
  def render_summary_markdown(summary: SummaryRecord, ...) -> str: ...
  def render_summary_txt(summary: SummaryRecord, ...) -> str:
      # strip Markdown headers and emphasis, keep structure
      md = render_summary_markdown(summary, ...)
      return md_to_plain(md)
  ```
- TXT is Markdown with `#`, `*`, `_` and similar markup stripped while preserving headings as plain text + blank-line separation.
- Both delivered as Browser-download (`Content-Disposition: attachment`).
- No PDF in MVP.
- No cloud-share (Drive/Dropbox) in MVP.

### Recording behavior (UX defaults)

| Setting | Default | Per-session override? |
|---|---|---|
| Aufnahme automatisch starten | **opt-in via toggle** on Setup screen | yes |
| Initial toggle state | off (first ever start) → remembers last choice | — |
| Mic-permission denied | session continues without recording, banner shown | — |
| Mic-test button on Setup screen | shown | — |
| Recording bitrate | 32 kbps | no |
| Pause behavior | recording pauses with timer (nahtlos resume) | no |

### LLM cascade

See `docs/research/2026-05-02-openrouter-models.md`. Pinned values:
- Default ordering: capability-first.
- Paid-fallback: `google/gemini-2.5-flash`.
- Local-fallback: Ollama `gemma3:4b-it-qat`.
- `PROMPT_VERSION = "v1.0-universal-summary"` (single universal prompt for MVP).
- Per-session override available via Settings → Advanced → "Force LLM model".

## What's deferred (post-MVP)

- Web Push notifications (v1.1)
- Per-mode summary prompts (v1.1)
- PDF export (v1.2)
- Cloud-share to Drive/Dropbox (v1.2)
- Multi-user accounts (v2.0)
- Self-hosted Whisper + pyannote on GPU box (v1.3+)
- Disk-level encryption at rest (v1.1, depends on Hostinger config support)
- Audio retention auto-deletion UI (v1.1; DB column already reserved)
- Postgres migration (v2.0; Alembic chain stays compatible)
- Mobile-native app (Swift) (v2.x; PWA covers MVP mobile use)

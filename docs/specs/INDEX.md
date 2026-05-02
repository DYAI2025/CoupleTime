# VibeMind Design Specs Index

Every spec here resolves a specific issue surfaced in the 2026-05-02 code review of the brainstorm. The associated plan is `docs/plans/2026-05-02-design-closure.md`.

## Specs

| ID resolved | Spec | Lines | What it pins |
|---|---|---|---|
| [C1] | [Job Queue](./job-queue.md) | 206 | SQLite + `RETURNING` atomic claim, single-worker poll, exponential backoff, stale-job reset |
| [C2] | [Resumable Upload](./resumable-upload.md) | 226 | 1 MiB sequential PUT chunks, `Content-Range`, SHA256 verify, `409` for duplicate chunk |
| [C3] | [Speaker Mapping](./speaker-mapping.md) | 202 | Decision rules for n=1, n=2, n≥3; per-turn override threshold (0.7 conf × 0.7 asym); confidence levels with UI consequences |
| [C4] | [Privacy Data Flow](./privacy-data-flow.md) | 93 | What stays on VPS vs leaves; in-app disclosure copy; investor-pitch wording; deferred mitigations |
| [C5] | [Pipeline Idempotency](./pipeline-idempotency.md) | 151 | Per-stage cache keys; "Summary neu generieren" ≠ Deepgram re-run; `PROMPT_VERSION` invalidation |
| [N1]–[N7] | [Monorepo & Defaults](./monorepo-and-defaults.md) | 238 | `apps/{frontend,backend}/`, audio defaults, SQLite PRAGMAs, Backblaze B2 backup, CORS, polling-not-Push, deferred-list |

## Research artifacts

| ID resolved | Doc | What it pins |
|---|---|---|
| [B1] | [OpenRouter Models — Paid Fallback](../research/2026-05-02-openrouter-models.md#paid-fallback-decision-resolves-b1) | `google/gemini-2.5-flash` at cascade Step 4, ~$0.007/session ceiling |
| [B2] | [OpenRouter Models — verification + Local Fallback](../research/2026-05-02-openrouter-models.md) | All four user-nominated free slugs verified existing; local Step 5 = Ollama `gemma3:4b-it-qat` |

## Cascade & decisions cross-reference

The LLM cascade (capability-first) lives in the research doc. The pipeline that drives it lives in `job-queue.md`. The flow that re-runs only the LLM stage on user corrections lives in `pipeline-idempotency.md`. The privacy posture that the cascade is constrained by lives in `privacy-data-flow.md`.

## How MVP.md will use this

When MVP.md is authored (next phase, after the brainstorm sections 2–8 are presented and approved), each section will reference these specs by relative link rather than restate them. MVP.md becomes the high-level map; these specs are the load-bearing detail.

## How the implementation plan will use this

The implementation plan (the plan after MVP.md) breaks each spec into bite-sized TDD tasks. Each task references the spec section it implements via `@docs/specs/<file>.md#section`. No hand-waving — anything not pinned in a spec gets a "decide this" task explicitly inserted in the implementation plan.

## Status

Phase 0 (this plan: design closure) — **complete after Plan-T12 verification**.

Phase 1 — write MVP.md (sections 2–8 of the brainstorm).
Phase 2 — write the implementation plan referencing these specs.
Phase 3 — execute the implementation plan (apps/frontend/ migration, backend scaffold, pipeline build-out, deploy).

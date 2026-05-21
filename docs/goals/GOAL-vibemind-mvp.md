# Goal: VibeMind MVP — End-to-End Session Pipeline

**Status:** In progress — Sprint I open  
**Owner:** DYAI2025  
**Last updated:** 2026-05-21

---

## What success looks like

A couple finishes a structured Zwiegespräch session. One partner had recording enabled. Within 2 minutes of the session ending, both can:

1. Open the app → see "View transcript" and "View summary" as active links (not greyed out)
2. Click transcript → read speaker-attributed Markdown transcript (Whisper + phase alignment)
3. Click summary → read 8-section structured semantic summary (LLM via OpenRouter/OpenAI)
4. Data persists across Railway redeployments

This pipeline must work **in production** (not just locally). "Works" means no 404s, no stub text when API keys are set, no ephemeral storage loss.

---

## Architecture

```
[Browser]
  SessionEngine → AudioRecorderService → MediaRecorder (webm/opus)
  SessionContext → VibeMindService → POST /sessions → POST /recording → POST /transcribe
  FinishedSessionView → polls GET /sessions/{id} every 5s → activates links when done

[Railway — FastAPI]
  POST /sessions        → creates session.json
  POST /recording       → saves audio + phases.json
  POST /transcribe      → background task:
    whisper-1           → WhisperSegments
    align_segments      → TranscriptTurns (phase-window overlap)
    summarize_transcript → call_llm → 8-section structured summary
    render_transcript_markdown → saves transcript.md + summary.md
  GET /sessions/{id}    → returns status, transcript_available, summary_available
  GET /transcript.md    → returns markdown transcript
  GET /summary.md       → returns LLM summary

[GitHub Pages — static React bundle]
  Built with VITE_VIBEMIND_API_URL baked in at CI build time
  Deployed via .github/workflows/deploy-gh-pages.yml
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3.4 |
| State | SessionContext (React Context + refs), useEffect polling |
| Recording | MediaRecorder API → webm/opus |
| Backend | FastAPI, Pydantic v2, Python 3.12, uv |
| Transcription | OpenAI Whisper API (`whisper-1`, verbose_json + segment timestamps) |
| LLM summary | openai SDK → OpenAI or OpenRouter (same client, different base_url) |
| Storage | Filesystem (`session_store.py`), Railway volume at `/data` |
| Deployment | Railway (backend), GitHub Pages (frontend via CI) |
| Tests | Vitest 4 + Testing Library (frontend), pytest + FastAPI TestClient (backend) |

---

## Out of scope for MVP

- Speaker diarization (pyannote.audio) — deferred
- Live transcription / live diarization
- PDF export
- Automated psychological interpretation
- Manual speaker correction UI in review view
- Offline / local-only LLM

---

## Gap analysis (as of 2026-05-21)

| ID | Severity | Status | Description |
|---|---|---|---|
| C1 | Critical | **DONE** | 2 SessionView tests timeout — fixed with data-testid |
| H1 | High | **DONE** | No polling loop — `startStatusPolling` added, links activate dynamically |
| H2 | High | **DONE** | `transcript_available` added to backend + frontend type |
| M2 | Medium | **DONE** | Recording consent banner added to ActiveSessionView |
| M-infra-A | Medium | Manual | GitHub secret `VITE_VIBEMIND_API_URL` not yet set |
| M-infra-B | Medium | Manual | Railway volume not yet mounted — sessions ephemeral |
| M-infra-C | Medium | Manual | LLM API key not yet set in Railway — returns stub |

All code gaps are addressed in: `docs/plans/2026-05-21-sprint-i-gap-close.md`

---

## Constraints (non-negotiable)

- **No skip / shorten on phases.** Core to the Moeller method. The recording records the full session including silences — do not add skip buttons.
- **LLM summary = observable communication patterns only.** No psychological diagnoses, no therapeutic recommendations. Prompt enforces this with explicit prohibition.
- **Preset mode durations are verbindlich.** Maintain ~90 min, Commitment ~60 min, Listening ~45 min. Not configurable.
- **Privacy:** Session audio and transcripts are personal data. GDPR applies. Recording is opt-in only, with visible notice while active. No data leaves the device except to the user-configured backend URL.

---

## Sprint history

| Sprint | Goal | Status |
|---|---|---|
| Gap Fixes | C3 fix + root redirect + CI workflow + storage warning | Done (see `docs/plans/2026-05-20-gap-fixes-sprint.md`) |
| H1 | LLM semantic summary pipeline | Done (see `docs/plans/2026-05-20-sprint-h1-llm-summary.md`) |
| **Sprint I** | CI green + polling + transcript_available + consent | **Done** → `docs/plans/2026-05-21-sprint-i-gap-close.md` |

---

## Definition of done (MVP)

- [ ] CI green on all pushes to `main`
- [ ] `npm run test:run` → 0 failures
- [ ] `uv run python -m pytest backend/tests/ -v` → 0 failures
- [ ] Production frontend at https://c-timer.machinetool.site shows VibeMind upload flow when `VITE_VIBEMIND_API_URL` secret is set
- [ ] After session completes, transcript + summary links become active within 2 min (not immediately greyed)
- [ ] Railway volume mounted → sessions survive redeployment
- [ ] LLM key set → summary.md contains real structured text (not stub)
- [ ] Recording notice visible in ActiveSessionView when mic is active

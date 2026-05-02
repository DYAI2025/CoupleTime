# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Couples Timer** is a web app for structured partner conversations ("Zwiegespräch") based on the Moeller method. It acts as a neutral "third instance" managing speaking time, order, and pauses so partners can focus on content rather than timing.

The project is being extended into a two-part system:

- **CoupleTimer (frontend, this repo):** session structuring, phase timeline, speakers A/B, timer/audio events, recording controls, review UI for transcript/summary. Today the app is a self-contained client (LocalStorage persistence). With the extension, it additionally captures per-session audio (one continuous file + phase-aligned metadata) and uploads it.
- **VibeMind (backend service, separate):** session API + audio storage, speaker diarization (e.g. pyannote.audio), batch transcription (Vibe/Sona, Whisper/whisper.cpp, optional faster-whisper), transcript ↔ diarization ↔ phase merge, semantic summary via OpenRouter / OpenAI-compatible LLM, Markdown / TXT export (PDF later).

**Core design decision — hybrid speaker attribution:** the timer's phase plan (`slotA → speaker A`, `slotB → speaker B`, etc.) is treated as a strong **prior**, not ground truth. The backend reconciles it against acoustic diarization so interjections, overlaps, and dialog inside monologic slots get attributed to the speaker who actually spoke. Final assignment = diarized speaker mapped onto timer A/B, weighted by phase-window overlap, corrected on clear acoustic divergence.

**MVP scope:**
- IN: session-level audio recording, phase/timeline export, backend diarization, timer↔diarization speaker mapping, batch transcription, speaker-attributed transcript, semantic summary, Markdown + TXT export, OpenRouter / OpenAI-compatible LLM config, review UI for manual speaker correction.
- OUT (deferred): live transcription, live diarization, mandatory local-only LLM, polished PDF export, automated psychological interpretation.

The summary output is structured (Kurzüberblick → Hauptthemen → was Person A/B sagte → Gesprächsdynamik → Vereinbarungen → offene Fragen → nächste Schritte → vollständiges Transkript) and must phrase dynamics as observable communication structure, not psychological diagnosis. Detailed MVP definition, data model (`AudioSegment`, `DiarizationTurn`, `SpeakerMapping`, `TranscriptTurn`), pipeline, and effort estimate (~35–65 PT with diarization) live in `projekt-vibeTimer.md`.

### Current State

The CoupleTimer frontend is implemented and shipping (timer engine, presets Maintain/Commitment/Listening, custom-mode builder, DE/EN i18n, audio cues, persistence). The VibeMind extension is **specified but not yet implemented** — no recording, upload, diarization, transcription, summary, or export code exists in this repo yet. Next step: populate the Specification phase and start scaffolding `MediaRecorder` capture + session/phase timeline export from the existing `SessionEngine`.

## Tech Stack

- React 19 + TypeScript 5.9, bundled with Vite 7 (`base: './'` for GitHub Pages / custom-domain hosting)
- Tailwind CSS 3.4, Framer Motion 12
- i18next + react-i18next (DE/EN), `@dnd-kit` for the custom-mode sequence builder
- Vitest 4 (jsdom) + Testing Library for unit/component tests; Playwright for E2E
- Note: `react-router-dom` is in dependencies but the app currently has no router — `App.tsx` mounts `<SessionProvider><SessionView/></SessionProvider>` and `SessionView` switches between setup / active / completed views from context state.

## Common Commands

```bash
npm run dev              # Vite dev server on http://localhost:5173
npm run build            # Production build to dist/
npm run preview          # Serve the built bundle

npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run (CI-style)
npm run test -- src/domain/__tests__/SessionEngine.test.ts   # single test file
npm run test:e2e         # Playwright (auto-starts `npm run dev`, see playwright.config.ts)

npm run lint             # ESLint
npm run format           # Prettier write on src/**/*.{ts,tsx}

npm run deploy           # build + gh-pages -d dist (publishes to gh-pages branch)
```

Vitest coverage (`include`) is intentionally scoped to `src/domain/**` and `src/services/**` — UI/components are not part of the coverage target. Test setup file: `src/test/setup.ts`. E2E specs live in `e2e/`.

## Architecture

### Layering

```
src/
├── domain/         Pure TS: SessionEngine, SessionMode (+ presets), SessionState,
│                   PhaseType/PhaseConfig, AudioEvent, GuidanceLevel, ParticipantConfig
├── services/       Side-effecting adapters with Protocol interfaces:
│                   AudioService (Web Audio API), TimerService (performance.now drift correction),
│                   GuidanceService, PersistenceService, ParticipantPersistenceService,
│                   BackgroundPersistenceService
├── viewmodels/     SessionViewModel.ts (selectors over SessionState),
│                   useSessionSetup.ts (custom-mode builder hook)
├── contexts/       SessionContext.tsx — wires SessionEngine + services + persisted state
│                   into a single React context; primary integration point for UI
├── hooks/          useFullscreen, useTipRotation
├── components/     UI (no business logic): SessionView (root switcher), SessionSetup,
│                   ModeSelector, CustomModeEditor, TimerDisplay, PhaseIndicator,
│                   ProgressBar, GuidancePanel, TipDisplay, ControlButtons,
│                   MainLayout, Settings/EnhancedSettings, FocusModeToggle,
│                   BackgroundSettings, LanguageSwitcher, onboarding/, ...
└── i18n/           index.ts + locales/{de,en}/translation.json
```

The dependency direction is one-way: `components → viewmodels → domain`, with `services` injected into `SessionEngine` via constructor (and into `SessionContext` via optional props for tests). Domain has zero React/DOM imports.

### SessionEngine (the heart)

`src/domain/SessionEngine.ts` is the single source of truth for session state. It owns a `SessionState` (status: idle/running/paused/finished, phase index, elapsed) and orchestrates three injected services:

- `AudioServiceProtocol` — fires bowl tones on phase transitions (see Audio Events below)
- `TimerServiceProtocol` — `performance.now()`-based ticker; engine recomputes remaining time each tick to self-correct drift (target accuracy: ±1s per 30 min)
- `GuidanceServiceProtocol` — returns tips appropriate to the current phase + GuidanceLevel

State changes flow through a single `subscribe(callback)` channel; `SessionContext` re-renders React on each tick. `getState()` returns an immutable copy.

### Phase model

`PhaseType`: `prep | slotA | slotB | transition | closingA | closingB | cooldown`. Helpers in `PhaseType.ts` (`isSpeakingPhase`, `isPartnerAPhase/B`, `getPhaseColor`, `getPhaseI18nKey`) are the canonical way to derive UI properties — don't hardcode phase strings.

`SessionMode` is `{ id, name, phases: PhaseConfig[], guidanceLevel, ... }`. Presets are defined in `SessionMode.presets.ts` (Maintain ~90 min, Commitment ~60 min, Listening ~45 min — exact sequences are in `_5_konkrete_preset_definitionen_verbindlich_.md` and are **verbindlich** / non-negotiable). Custom modes are validated via `isSessionModeValid` (must contain ≥1 slotA and ≥1 slotB; per-phase duration bounds enforced).

### Audio events

Six bowl events are **generated at runtime** via Web Audio API (sinus + harmonics with decay) — there are no WAV files in `public/`. Triggers:

| Event | Trigger |
|---|---|
| `sessionStart` | bowl_deep_single — session starts |
| `slotEnd` | bowl_rising — speaking slot ends |
| `transitionEnd` | bowl_clear — transition ends |
| `closingStart` | bowl_double — closing phase begins |
| `cooldownStart` | bowl_fade — cooldown begins |
| `cooldownEnd` | bowl_triple — session complete |

Browser policy: audio only plays after the user's first interaction. The engine respects this — `AudioService` is unlocked from a user gesture in `SessionContext`/setup.

## Critical Design Rules

- **No skip / shorten on individual phases.** Only `pause`, `resume`, `stop` (whole session). The "no skip buttons" rule is core to the Moeller method — don't add UI that violates it, even on Custom modes.
- **Strict phase order.** `SessionEngine` advances deterministically through `mode.phases`; never mutate the phase array mid-session.
- **Custom-mode validation** (`SessionMode.ts → isSessionModeValid`): ≥1 slotA, ≥1 slotB, durations within per-type bounds (prep 30–600s, slotA/B 300–1800s, transition 30–300s, closingA/B 60–600s, cooldown 300–1800s).
- **GuidanceLevel gates tips** (see `GuidanceService`): `minimal` = cooldown only; `moderate` = + transition; `high` = + prep.
- **Persistence keys** are owned by the dedicated `*PersistenceService` modules — go through them, don't read/write LocalStorage directly from components.
- **i18n:** every user-facing string lives in `src/i18n/locales/{de,en}/translation.json`. Phase labels use `getPhaseI18nKey(phase)` → `phases.<phaseType>`. Adding a string in one locale without the other will break the language switch.

## Deployment

`npm run deploy` builds and pushes `dist/` to the `gh-pages` branch (custom domain in `CNAME`). `vite.config.ts` uses `base: './'` so assets resolve under both subpath and root hosting. `deploy-ftp.sh` and `deploy-hostinger.sh` are alternative deployment scripts; see `DEPLOYMENT.md` / `HOSTINGER-DEPLOY.md` if asked to deploy elsewhere.

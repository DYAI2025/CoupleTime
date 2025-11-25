# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Couples Timer** is a web app for structured partner conversations ("Zwiegespräch") based on the Moeller method. It serves as a neutral "third instance" managing speaking times, order, and pauses - partners focus on content, not timing.

## Tech Stack

- React 18+ with TypeScript 5+
- Vite as build tool
- Tailwind CSS for styling
- Framer Motion for animations
- i18next + react-i18next for DE/EN localization
- Vitest + React Testing Library for unit/component tests
- Playwright for E2E tests

## Common Commands

```bash
# Development
npm run dev           # Start dev server

# Testing
npm run test          # Run unit tests (Vitest)
npm run test:e2e      # Run E2E tests (Playwright)

# Build
npm run build         # Production build
npm run lint          # ESLint check
```

## Architecture

```
src/
├── domain/          # Pure TypeScript domain models & SessionEngine (UI-independent)
├── services/        # Browser APIs: AudioService, TimerService, GuidanceService, PersistenceService
├── viewModel/       # React Context/Hooks bridging domain to UI (useSession, useModeSelection)
├── components/      # UI components: TimerDisplay, PhaseIndicator, GuidanceTip, ModeCard
├── pages/           # Views: ModeSelectionPage, SessionPage, SequenceBuilderPage
└── i18n/            # Localization files (en/de translation.json)

public/audio/        # Singing bowl sounds (6 WAV files)
```

### Key Domain Concepts

- **PhaseType**: prep, slotA, slotB, transition, closingA, closingB, cooldown
- **SessionMode**: Preset modes (Maintain, Commitment, Listening) + custom modes
- **SessionEngine**: Central state machine controlling session flow, timer, audio triggers
- **GuidanceLevel**: minimal, moderate, high - determines which tips are shown

### Session Modes

Four modes with defined phase sequences (see `_5_konkrete_preset_definitionen_verbindlich_.md` for details):

1. **Maintain** (~90 min, 3 Runden × 15 min) - Wöchentliches Beziehungshygiene-Gespräch
2. **Commitment** (~60 min, 3 Runden × 10 min) - Stabilisierung in Krisenphasen (2x/Woche)
3. **Listening** (~45 min, 2 Runden × 10 min) - Einsteiger-Modus mit mehr Guidance
4. **Custom** - User-configurable sequence (must have at least one slotA and slotB)

### Critical Design Rules

- **No skip buttons**: Users cannot skip or shorten individual speaking phases - only pause/resume/stop entire session
- **Strict phase order**: SessionEngine enforces deterministic phase progression
- **Timer accuracy**: Target ±1 second per 30 minutes (use `performance.now()` for drift correction)
- **Audio consent**: Audio only plays after explicit user interaction (browser policy)

### Audio Events

Six singing bowl sounds (generated via Web Audio API) triggered at:
- `sessionStart` → bowl_deep_single (tiefer Klang)
- `slotEnd` → bowl_rising (aufsteigend)
- `transitionEnd` → bowl_clear (klar)
- `closingStart` → bowl_double (doppelt)
- `cooldownStart` → bowl_fade (ausklingend)
- `cooldownEnd` → bowl_triple (dreifach)

## Testing Requirements

- Domain models and SessionEngine: ≥80% test coverage
- All four modes must be end-to-end testable
- Custom modes: create, edit, save, reload, execute flow must work
- i18n: Language switch changes all UI strings without reload

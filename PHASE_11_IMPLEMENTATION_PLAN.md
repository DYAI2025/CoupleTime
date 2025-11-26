# Phase 11 Implementation Plan: Participant Personalization

## Overview
Implement participant name and color personalization with dynamic background colors that change based on the active speaker (Partner A or Partner B).

## Prerequisites
- Existing codebase at v1.0.0
- All 338 tests passing
- React 18 + TypeScript 5 + Vite setup
- Tailwind CSS configured

## Tasks

### Task 1: Create ParticipantConfig Domain Type

**Goal:** Define the domain model for participant configuration

**Steps:**
1. Create file `src/domain/ParticipantConfig.ts`
2. Define `ParticipantConfig` interface with fields: `nameA`, `nameB`, `colorA`, `colorB`
3. Export `DEFAULT_PARTICIPANT_CONFIG` constant with default values
4. Export `PARTICIPANT_COLOR_PALETTE` array with 8 calm, accessible colors
5. Add helper function `getParticipantName(speaker: Speaker, config: ParticipantConfig): string`
6. Add helper function `getParticipantColor(speaker: Speaker, config: ParticipantConfig): string`

**Verification:**
```bash
npm run build
```
Should build without errors.

**Files to create:**
- `src/domain/ParticipantConfig.ts`

---

### Task 2: Extend SessionState with ParticipantConfig

**Goal:** Add participant configuration to session state

**Steps:**
1. Open `src/domain/SessionState.ts`
2. Import `ParticipantConfig` from `./ParticipantConfig`
3. Add field `participantConfig: ParticipantConfig | null` to `SessionState` interface
4. Update `createInitialState()` to set `participantConfig: null`

**Verification:**
```bash
npm run build
```
Should build without errors.

**Files to modify:**
- `src/domain/SessionState.ts`

---

### Task 3: Update SessionEngine to Accept ParticipantConfig

**Goal:** Allow engine to receive and store participant configuration on session start

**Steps:**
1. Open `src/domain/SessionEngine.ts`
2. Import `ParticipantConfig` from `./ParticipantConfig`
3. Find the `start(mode: SessionMode)` method signature
4. Update signature to `start(mode: SessionMode, participantConfig?: ParticipantConfig)`
5. In the method body, update the state initialization to include `participantConfig: participantConfig ?? null`
6. Ensure the config is passed through to the state

**Verification:**
```bash
npm run build
npm run test:run
```
All tests should still pass.

**Files to modify:**
- `src/domain/SessionEngine.ts`

---

### Task 4: Update SessionContext to Handle ParticipantConfig

**Goal:** Update context to pass participant config to engine

**Steps:**
1. Open `src/contexts/SessionContext.tsx`
2. Import `ParticipantConfig` from `../domain/ParticipantConfig`
3. Update `start` action signature in `SessionContextValue` interface to `start: (mode: SessionMode, participantConfig?: ParticipantConfig) => Promise<boolean>`
4. Update the `start` callback implementation to accept `participantConfig` parameter
5. Pass `participantConfig` to `engine.start(mode, participantConfig)`

**Verification:**
```bash
npm run build
```
Should build without errors.

**Files to modify:**
- `src/contexts/SessionContext.tsx`

---

### Task 5: Extend SessionViewModel with Participant Names

**Goal:** Make participant names available in view model for UI consumption

**Steps:**
1. Open `src/viewmodels/SessionViewModel.ts`
2. Import `ParticipantConfig, DEFAULT_PARTICIPANT_CONFIG` from `../domain/ParticipantConfig`
3. Add fields to `SessionViewModel` interface:
   - `participantNameA: string`
   - `participantNameB: string`
   - `participantColorA: string`
   - `participantColorB: string`
4. In `createSessionViewModel` function, derive these values from `state.participantConfig ?? DEFAULT_PARTICIPANT_CONFIG`
5. Update `speakerDisplayName` to use participant names instead of hardcoded "Partner A/B"

**Verification:**
```bash
npm run build
npm run test:run
```
All tests should still pass.

**Files to modify:**
- `src/viewmodels/SessionViewModel.ts`

---

### Task 6: Create Color Contrast Utility

**Goal:** Ensure WCAG AA compliance for text on colored backgrounds

**Steps:**
1. Create file `src/utils/colorContrast.ts`
2. Implement `hexToRgb(hex: string): {r: number, g: number, b: number}` function
3. Implement `calculateLuminance(rgb: {r: number, g: number, b: number}): number` using WCAG formula
4. Implement `calculateContrastRatio(color1: string, color2: string): number`
5. Implement `getContrastingTextColor(bgColor: string): string` that returns dark or light color
6. Implement `meetsContrastRequirement(bg: string, fg: string, ratio?: number): boolean` with default ratio 4.5

**Verification:**
```bash
npm run build
```
Should build without errors.

**Files to create:**
- `src/utils/colorContrast.ts`

---

### Task 7: Create useParticipantBackground Hook

**Goal:** Provide dynamic background color based on active speaker

**Steps:**
1. Create file `src/hooks/useParticipantBackground.ts`
2. Import necessary dependencies: `useSession`, `getCurrentPhase`, `getSpeakerForPhase`, `Speaker`, `useMemo`
3. Create hook `useParticipantBackground()` that:
   - Gets current session state
   - Determines current speaker from phase
   - Returns appropriate background color (colorA for Speaker.A, colorB for Speaker.B, null for Speaker.None)
   - Also returns text color using `getContrastingTextColor`
4. Export the hook

**Verification:**
```bash
npm run build
```
Should build without errors.

**Files to create:**
- `src/hooks/useParticipantBackground.ts`

---

### Task 8: Create SessionSetup Modal Component

**Goal:** UI for entering participant names and selecting colors before session start

**Steps:**
1. Create file `src/components/SessionSetup.tsx`
2. Import dependencies: `useState`, `ParticipantConfig`, `DEFAULT_PARTICIPANT_CONFIG`, `PARTICIPANT_COLOR_PALETTE`, `useTranslation`, `motion` from framer-motion
3. Create component `SessionSetup` with props:
   - `isOpen: boolean`
   - `onClose: () => void`
   - `onConfirm: (config: ParticipantConfig) => void`
4. Implement state management for name and color selection
5. Create UI layout:
   - Modal backdrop with Framer Motion AnimatePresence
   - Two sections: Partner A and Partner B
   - Each section has: name input + color palette selector
   - Color swatches from PARTICIPANT_COLOR_PALETTE (show visual selection indicator)
   - Cancel and "Start Session" buttons at bottom
6. Add validation: prevent starting with empty names by falling back to defaults
7. Style with Tailwind CSS for clean, accessible design

**Verification:**
```bash
npm run build
```
Should build without errors. Component should render when isOpen=true.

**Files to create:**
- `src/components/SessionSetup.tsx`

---

### Task 9: Integrate SessionSetup into SessionView

**Goal:** Show setup modal before starting a session

**Steps:**
1. Open `src/components/SessionView.tsx`
2. Import `SessionSetup` component
3. Import `ParticipantConfig` type
4. In `ModeSelectionView` component, add state: `const [setupOpen, setSetupOpen] = useState(false)`
5. Add state: `const [pendingMode, setPendingMode] = useState<SessionMode | null>(null)`
6. Modify the `StartButton` to:
   - Not start session directly
   - Instead: set `pendingMode` and open setup modal
7. Add `SessionSetup` component to JSX:
   - `isOpen={setupOpen}`
   - `onClose={() => { setSetupOpen(false); setPendingMode(null) }}`
   - `onConfirm={(config) => { session.start(pendingMode!, config); setSetupOpen(false) }}`
8. Position modal appropriately in the component tree

**Verification:**
```bash
npm run dev
```
Navigate to app, select a mode, click Start. Setup modal should appear.

**Files to modify:**
- `src/components/SessionView.tsx`

---

### Task 10: Apply Dynamic Background to SessionView

**Goal:** Change background color based on active speaker

**Steps:**
1. Open `src/components/SessionView.tsx`
2. In `ActiveSessionView` component, use `useParticipantBackground()` hook
3. Destructure `{ backgroundColor, textColor }` from hook
4. Wrap the session view in a `motion.div`
5. Use `animate` prop to transition `backgroundColor`
6. Set transition with `duration: 1.2` and `ease: 'easeInOut'`
7. Apply computed `textColor` to text elements for contrast
8. Ensure smooth transitions between phases

**Verification:**
```bash
npm run dev
```
Start a session with custom colors. During SlotA/ClosingA, background should be Partner A's color. During SlotB/ClosingB, background should be Partner B's color.

**Files to modify:**
- `src/components/SessionView.tsx`

---

### Task 11: Update PhaseIndicator to Use Participant Names

**Goal:** Replace hardcoded "Partner A/B" with actual participant names

**Steps:**
1. Open `src/components/PhaseIndicator.tsx`
2. In the component, get participant names from `viewModel.participantNameA` and `viewModel.participantNameB`
3. Update the speaker name display (line ~122) to use these dynamic names
4. Ensure the speaker icon and badge still display correctly
5. Consider adding a subtle color indicator (small dot/badge) matching participant's color

**Verification:**
```bash
npm run dev
```
Start session with custom names. PhaseIndicator should show the custom names instead of "Partner A/B".

**Files to modify:**
- `src/components/PhaseIndicator.tsx`

---

### Task 12: Add i18n Translations for Participant Setup

**Goal:** Add localized strings for the setup modal

**Steps:**
1. Open `src/i18n/locales/en/translation.json`
2. Add new section `"participants"`:
   ```json
   "participants": {
     "setup": "Setup Participants",
     "partnerA": "Partner A",
     "partnerB": "Partner B",
     "namePlaceholder": "Enter name",
     "nameLabel": "Name",
     "chooseColor": "Choose Color",
     "cancel": "Cancel",
     "startSession": "Start Session"
   }
   ```
3. Open `src/i18n/locales/de/translation.json`
4. Add German translations for the same keys
5. Update SessionSetup component to use these i18n keys via `useTranslation()`

**Verification:**
```bash
npm run build
npm run dev
```
Test language switcher - modal should show correct language.

**Files to modify:**
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/de/translation.json`
- `src/components/SessionSetup.tsx` (update to use i18n)

---

### Task 13: Write Unit Tests for ParticipantConfig

**Goal:** Test domain logic for participant configuration

**Steps:**
1. Create file `src/domain/__tests__/ParticipantConfig.test.ts`
2. Write test for default config values
3. Write test for `getParticipantName` helper
4. Write test for `getParticipantColor` helper
5. Write test for color palette (ensure 8 colors, all valid hex)
6. Run tests with `npm run test:run`

**Verification:**
```bash
npm run test:run src/domain/__tests__/ParticipantConfig.test.ts
```
All tests should pass.

**Files to create:**
- `src/domain/__tests__/ParticipantConfig.test.ts`

---

### Task 14: Write Unit Tests for Color Contrast Utility

**Goal:** Verify WCAG compliance calculations

**Steps:**
1. Create file `src/utils/__tests__/colorContrast.test.ts`
2. Test `hexToRgb` with valid hex colors
3. Test `calculateContrastRatio` with known color pairs
4. Test `getContrastingTextColor` returns dark text for light backgrounds and vice versa
5. Test `meetsContrastRequirement` with passing and failing contrast ratios
6. Run tests

**Verification:**
```bash
npm run test:run src/utils/__tests__/colorContrast.test.ts
```
All tests should pass.

**Files to create:**
- `src/utils/__tests__/colorContrast.test.ts`

---

### Task 15: Write Component Tests for SessionSetup

**Goal:** Test setup modal behavior

**Steps:**
1. Create file `src/components/__tests__/SessionSetup.test.tsx`
2. Test modal renders when `isOpen=true`
3. Test modal does not render when `isOpen=false`
4. Test name input changes update local state
5. Test color selection updates local state
6. Test "Start Session" button calls `onConfirm` with correct config
7. Test "Cancel" button calls `onClose`
8. Run tests

**Verification:**
```bash
npm run test:run src/components/__tests__/SessionSetup.test.tsx
```
All tests should pass.

**Files to create:**
- `src/components/__tests__/SessionSetup.test.tsx`

---

### Task 16: Integration Test for Complete Flow

**Goal:** Verify end-to-end participant personalization flow

**Steps:**
1. Create file `src/__tests__/participantPersonalization.integration.test.tsx`
2. Test flow:
   - Render SessionView
   - Select a mode
   - Click Start
   - Setup modal appears
   - Enter names and colors
   - Click "Start Session"
   - Verify session starts with correct config
   - Verify background changes during phase transitions
3. Run tests

**Verification:**
```bash
npm run test:run src/__tests__/participantPersonalization.integration.test.tsx
```
All tests should pass.

**Files to create:**
- `src/__tests__/participantPersonalization.integration.test.tsx`

---

### Task 17: Final Verification and Build

**Goal:** Ensure all code compiles, tests pass, and app works correctly

**Steps:**
1. Run TypeScript compiler: `npm run build`
2. Run all tests: `npm run test:run`
3. Start dev server: `npm run dev`
4. Manually test the complete flow:
   - Select "Commitment" mode
   - Click Start
   - Enter custom names (e.g., "Alex" and "Jordan")
   - Select different colors for each
   - Start session
   - Verify background changes to Alex's color during SlotA
   - Verify background changes to Jordan's color during SlotB
   - Verify names appear in PhaseIndicator
5. Test with all 3 preset modes
6. Test language switcher (DE/EN)
7. Test dark mode compatibility

**Verification:**
- Build: ✓ No TypeScript errors
- Tests: ✓ All tests passing
- Manual: ✓ Features work as expected

---

## Summary

This plan implements Phase 11 (Participant Personalization) with:
- Custom names for Partner A and Partner B
- Color selection from a calm, accessible palette
- Dynamic background colors that transition smoothly based on active speaker
- Full i18n support (DE/EN)
- WCAG AA compliant contrast ratios
- Comprehensive test coverage
- Clean integration with existing architecture

**Total tasks:** 17
**Estimated complexity:** Medium
**Architecture impact:** Extends domain, adds new UI component, updates session flow

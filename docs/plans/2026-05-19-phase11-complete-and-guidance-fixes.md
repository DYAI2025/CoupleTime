# Phase 11 Complete + GuidancePanel Correctness

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish Phase 11 (Participant Personalization) and fix all GuidancePanel correctness gaps, while eliminating all TypeScript errors and keeping 37/37 test files green throughout — delivered in three sprint-style iterations, each with working, testable software.

**Architecture:** Three sprints. Sprint 1 cleans pre-existing TypeScript errors and fixes GuidancePanel semantic bugs — no new files, only surgical edits to identified locations. Sprint 2 completes Phase 11 by adding `colorContrast` utility + `useParticipantBackground` hook, extending `SessionViewModel` with participant data, and wiring `SessionSetup` into `ModeSelectionView`. Sprint 3 adds VibeMind audio recording to the frontend (no backend required). Every sprint ends with `/code-review-ai-ai-review` + fix cycle before shipping.

**Key architecture facts (read before coding):**
- `SessionContext` already holds `participantConfig: ParticipantConfig` in context value — accessible via `useSession().participantConfig`
- `SessionViewModel` has `modeId: string | null`, `isSpeakerA`, `isSpeakerB` — but NOT `participantColorA/B` or `participantNameA/B` (Sprint 2 adds these)
- `SessionSetup` is a default export (`const SessionSetup: React.FC`) with props `{ config, onSave, onCancel }` — it renders its own backdrop
- `PhaseType.ts` exports `isPartnerAPhase()` and `isPartnerBPhase()` ✅
- `isValidGuidanceSettings()` exists in `GuidanceSettings.ts` but is never called — dead code
- `enableInMaintain` in `GuidanceSettings` is never read — `modeId === 'maintain'` check in ViewModel is the fix

**Tech Stack:** React 19, TypeScript 5.9, Tailwind 3.4, Framer Motion 12, react-i18next, lucide-react, Vitest 4 + Testing Library.

---

## Sprint 1 — TypeScript Health + GuidancePanel Correctness

**Sprint goal:** `npm run typecheck` returns 0 errors, phase-specific tips appear in Deep Dive, GuidancePanel respects Maintain mode setting.

**Files touched in this sprint (open each only once — tasks are ordered accordingly):**
- `src/hooks/useFullscreen.ts` → Task 1.1
- `src/components/BackgroundSettings.tsx` → Task 1.2 (with Settings/index)
- `src/components/Settings.tsx` → Task 1.2
- `src/components/index.ts` → Task 1.2
- `src/contexts/SessionContext.tsx` → Task 1.3
- `src/services/PersistenceService.ts` → Task 1.4 (with its test)
- `src/services/__tests__/PersistenceService.test.ts` → Task 1.4
- `src/components/DeepDiveView.tsx` → Task 1.5 (with GuidancePanel + visual test)
- `src/components/GuidancePanel.tsx` → Task 1.5
- `src/components/__tests__/DeepDiveView.visual.test.tsx` → Task 1.5
- `src/i18n/locales/en/translation.json` → Task 1.5
- `src/i18n/locales/de/translation.json` → Task 1.5
- `src/components/SessionView.tsx` → Task 1.6 (with its test)
- `src/components/__tests__/SessionView.test.tsx` → Task 1.6

---

### Task 1.1 — Fix useFullscreen vendor-prefix TypeScript errors

**Files:**
- Modify: `src/hooks/useFullscreen.ts`

**Step 1: Read the file**

```bash
cat -n src/hooks/useFullscreen.ts
```

Locate the 10 lines that call vendor-prefixed methods (`webkitRequestFullscreen`, `msExitFullscreen`, `webkitExitFullscreen`, `mozCancelFullScreen`, `webkitFullscreenElement`, `mozFullScreenElement`, `msFullscreenElement`).

**Step 2: No test needed — typecheck IS the test**

```bash
npm run typecheck 2>&1 | grep "useFullscreen"
```

Expected: 10 TS errors on vendor-prefix lines.

**Step 3: Cast call sites to `any` with optional chaining**

Pattern for each vendor-prefix call — cast the receiver only, not the whole expression:

```ts
// Before
element.msRequestFullscreen()
document.webkitExitFullscreen()
document.mozFullScreenElement

// After
(element as any).msRequestFullscreen?.()
;(document as any).webkitExitFullscreen?.()
;(document as any).mozFullScreenElement
```

Apply this pattern for all 10 lines. Use optional chaining (`?.()`) on method calls to prevent runtime errors on browsers that don't support the prefix.

**Step 4: Verify typecheck**

```bash
npm run typecheck 2>&1 | grep "useFullscreen"
```

Expected: 0 lines.

**Step 5: Run tests**

```bash
npm run test:run 2>&1 | tail -5
```

Expected: 37 passed (no tests broke).

**Step 6: Commit**

```bash
git add src/hooks/useFullscreen.ts
git commit -m "fix: cast vendor-prefix fullscreen APIs to suppress TS errors"
```

---

### Task 1.2 — Fix Settings/index/BackgroundSettings export conflicts

**Files:**
- Modify: `src/components/BackgroundSettings.tsx`
- Modify: `src/components/Settings.tsx`
- Modify: `src/components/index.ts`

**Step 1: Read current errors**

```bash
npm run typecheck 2>&1 | grep -E "Settings|BackgroundSettings|isEditing"
```

Expected errors:
```
src/components/index.ts(35,10): TS2614: Module '"./Settings"' has no exported member 'SettingsButton'
src/components/Settings.tsx(6,10): TS2614: Module '"./BackgroundSettings"' has no exported member 'BackgroundSettings'
src/components/Settings.tsx(7,10): TS2614: Module '"./SessionSetup"' has no exported member 'SessionSetup'
src/components/BackgroundSettings.tsx(21,10): TS6133: 'isEditing' is declared but its value is never read.
```

**Step 2: Determine export style of each component**

```bash
grep -n "^export default\|^const.*React.FC\|^export function\|^export const" \
  src/components/BackgroundSettings.tsx \
  src/components/Settings.tsx \
  src/components/SessionSetup.tsx
```

All three use `export default` (default export pattern). Imports in Settings.tsx and index.ts use named imports — that's the mismatch.

**Step 3: Fix BackgroundSettings.tsx — remove unused variable**

```bash
grep -n "isEditing" src/components/BackgroundSettings.tsx
```

Find the declaration line. Delete it (or prefix with `_` if destructuring requires the position).

**Step 4: Fix Settings.tsx imports**

```tsx
// Before
import { BackgroundSettings } from './BackgroundSettings'
import { SessionSetup } from './SessionSetup'

// After
import BackgroundSettings from './BackgroundSettings'
import SessionSetup from './SessionSetup'
```

**Step 5: Fix index.ts**

```bash
grep -n "SettingsButton\|Settings" src/components/index.ts
```

If `SettingsButton` is a named export from Settings.tsx that exists → keep as-is.
If it's not exported from Settings.tsx → remove or alias the default:

```ts
// Before (if Settings.tsx has no named export 'SettingsButton')
export { SettingsButton } from './Settings'

// After (re-export default as named)
export { default as SettingsButton } from './Settings'
// OR if it's genuinely gone, remove the line entirely
```

**Step 6: Verify**

```bash
npm run typecheck 2>&1 | grep -E "Settings|BackgroundSettings|isEditing"
```

Expected: 0 lines.

**Step 7: Run tests**

```bash
npm run test:run 2>&1 | tail -5
```

Expected: 37 passed.

**Step 8: Commit**

```bash
git add src/components/BackgroundSettings.tsx src/components/Settings.tsx src/components/index.ts
git commit -m "fix: resolve default-vs-named export mismatches in Settings/BackgroundSettings/index"
```

---

### Task 1.3 — Remove unused import in SessionContext.tsx

**Files:**
- Modify: `src/contexts/SessionContext.tsx`

**Step 1: Verify the error**

```bash
npm run typecheck 2>&1 | grep "SessionContext"
```

Expected: `TS6133: 'createDefaultParticipantConfig' is declared but its value is never read`

**Step 2: Remove the import**

```bash
grep -n "createDefaultParticipantConfig" src/contexts/SessionContext.tsx
```

Delete that import line. The function is imported but `participantPersistenceService.loadConfig()` is used instead.

**Step 3: Verify**

```bash
npm run typecheck 2>&1 | grep "SessionContext"
```

Expected: 0 lines.

**Step 4: Commit**

```bash
git add src/contexts/SessionContext.tsx
git commit -m "fix: remove unused createDefaultParticipantConfig import in SessionContext"
```

---

### Task 1.4 — Wire isValidGuidanceSettings into PersistenceService (TDD)

**Files:**
- Modify: `src/services/__tests__/PersistenceService.test.ts`
- Modify: `src/services/PersistenceService.ts`

**Step 1: Write the failing test**

Add inside the `PersistenceService - Guidance Settings` describe block in `PersistenceService.test.ts`:

```ts
it('should return defaults when stored guidanceMode is invalid', () => {
  localStorage.setItem(
    'couples-timer-guidance-settings',
    JSON.stringify({ guidanceMode: 'garbage', enableInMaintain: false, showAllTips: false, autoRotateInterval: 20 })
  )
  const settings = PersistenceService.loadGuidanceSettings()
  expect(settings).toEqual(DEFAULT_GUIDANCE_SETTINGS)
})

it('should return defaults when stored autoRotateInterval is out of range', () => {
  localStorage.setItem(
    'couples-timer-guidance-settings',
    JSON.stringify({ guidanceMode: 'quick', enableInMaintain: false, showAllTips: false, autoRotateInterval: 999 })
  )
  const settings = PersistenceService.loadGuidanceSettings()
  expect(settings).toEqual(DEFAULT_GUIDANCE_SETTINGS)
})
```

**Step 2: Run and verify failure**

```bash
npm run test:run src/services/__tests__/PersistenceService.test.ts
```

Expected: 2 new FAILs — currently `loadGuidanceSettings` does raw merge without validation, so invalid `guidanceMode: 'garbage'` is returned as-is.

**Step 3: Fix PersistenceService.loadGuidanceSettings()**

Add import at top of `src/services/PersistenceService.ts`:
```ts
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS, isValidGuidanceSettings } from '../domain/GuidanceSettings'
```

Change `loadGuidanceSettings()`:
```ts
loadGuidanceSettings(): GuidanceSettings {
  try {
    const stored = localStorage.getItem(GUIDANCE_SETTINGS_KEY)
    if (!stored) return { ...DEFAULT_GUIDANCE_SETTINGS }
    const parsed = JSON.parse(stored)
    const merged = { ...DEFAULT_GUIDANCE_SETTINGS, ...parsed }
    if (!isValidGuidanceSettings(merged)) return { ...DEFAULT_GUIDANCE_SETTINGS }
    return merged
  } catch {
    console.warn('Failed to load guidance settings from localStorage')
    return { ...DEFAULT_GUIDANCE_SETTINGS }
  }
}
```

**Step 4: Run tests**

```bash
npm run test:run src/services/__tests__/PersistenceService.test.ts
```

Expected: All pass.

**Step 5: Full suite**

```bash
npm run test:run 2>&1 | tail -5
```

Expected: 37 passed.

**Step 6: Commit**

```bash
git add src/services/PersistenceService.ts src/services/__tests__/PersistenceService.test.ts
git commit -m "fix: validate guidance settings on load — reject malformed localStorage data"
```

---

### Task 1.5 — Fix DeepDiveView + GuidancePanel (phase tips + shuffleMode)

**Files:**
- Modify: `src/components/DeepDiveView.tsx`
- Modify: `src/components/GuidancePanel.tsx`
- Modify: `src/components/__tests__/DeepDiveView.visual.test.tsx`
- Modify: `src/i18n/locales/en/translation.json`
- Modify: `src/i18n/locales/de/translation.json`

**Step 1: Write the failing test (TDD)**

In `src/components/__tests__/DeepDiveView.visual.test.tsx`, add at the end of the describe block:

```tsx
it('renders phase-specific tips when provided', async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <DeepDiveView tips={['Custom tip alpha', 'Custom tip beta']} showAllTips={true} />
    </I18nextProvider>
  )
  await waitFor(() => {
    expect(screen.getByText('Custom tip alpha')).toBeInTheDocument()
    expect(screen.getByText('Custom tip beta')).toBeInTheDocument()
  })
})

it('shows only first tip when showAllTips is false', async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <DeepDiveView tips={['First tip', 'Second tip']} showAllTips={false} />
    </I18nextProvider>
  )
  await waitFor(() => {
    expect(screen.getByText('First tip')).toBeInTheDocument()
    expect(screen.queryByText('Second tip')).not.toBeInTheDocument()
  })
})
```

**Step 2: Run and verify failure**

```bash
npm run test:run src/components/__tests__/DeepDiveView.visual.test.tsx
```

Expected: 2 FAILs — `_props` discards tips so neither text appears.

**Step 3: Rewrite DeepDiveView to use props**

Replace the entire `export function DeepDiveView(_props: DeepDiveViewProps)` implementation:

```tsx
export function DeepDiveView({ tips, showAllTips }: DeepDiveViewProps) {
  const { t } = useTranslation()

  const sections = SECTION_KEYS.map(
    (key) => t(`guidance.deepDive.${key}`, { returnObjects: true }) as DeepDiveSection
  )

  const displayedTips = showAllTips ? tips : tips.slice(0, 1)

  return (
    <div className="overflow-y-auto px-4 py-2 space-y-6">
      {/* Phase-specific tips (dynamic, from current session phase) */}
      {displayedTips.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {t('guidancePanel.phaseTips', 'Phase Tips')}
          </h2>
          <div className="space-y-2">
            {displayedTips.map((tip, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-start gap-3"
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static guidance sections from i18n */}
      {sections.map((section, si) => (
        <div key={si}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {section.title}
          </h2>
          <div className="space-y-2">
            {(section.cards ?? []).map((card, ci) => {
              const IconComp: LucideIcon = ICON_MAP[card.icon] ?? HelpCircle
              return (
                <div
                  key={ci}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-start gap-3"
                >
                  <IconComp className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {card.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 4: Add missing i18n key**

In `src/i18n/locales/en/translation.json`, inside `"guidancePanel"`:
```json
"phaseTips": "Phase Tips"
```

In `src/i18n/locales/de/translation.json`, inside `"guidancePanel"`:
```json
"phaseTips": "Phasentipps"
```

**Step 5: Fix GuidancePanel shuffleMode conflation**

In `src/components/GuidancePanel.tsx`, change the QuickTipsView call:
```tsx
// Before
shuffleMode={settings.showAllTips}

// After (sequential rotation is correct; random shuffle degrades UX)
shuffleMode={false}
```

**Step 6: Run full suite**

```bash
npm run test:run 2>&1 | tail -5
```

Expected: 37+ passed.

**Step 7: Typecheck**

```bash
npm run typecheck 2>&1 | grep "DeepDiveView\|GuidancePanel"
```

Expected: 0 lines.

**Step 8: Commit**

```bash
git add src/components/DeepDiveView.tsx src/components/GuidancePanel.tsx \
  src/components/__tests__/DeepDiveView.visual.test.tsx \
  src/i18n/locales/en/translation.json src/i18n/locales/de/translation.json
git commit -m "fix: DeepDiveView renders phase tips, GuidancePanel uses sequential rotation"
```

---

### Task 1.6 — Wire enableInMaintain to conditionally hide GuidancePanel

**Files:**
- Modify: `src/components/SessionView.tsx` (ActiveSessionView section only)
- Modify: `src/components/__tests__/SessionView.test.tsx`

**Context:** `viewModel.modeId` already exists in `SessionViewModel`. `guidanceSettings.enableInMaintain` already exists. Just need to combine them in ActiveSessionView.

**Step 1: Read existing SessionView tests to understand mock pattern**

```bash
grep -n "describe\|it(\|mock\|vi\." src/components/__tests__/SessionView.test.tsx | head -30
```

Understand how the existing tests mock SessionContext/ViewModel.

**Step 2: Write the failing test**

Add to `SessionView.test.tsx`:

```tsx
it('hides GuidancePanel when mode is maintain and enableInMaintain is false', () => {
  // Use the same mock setup pattern as existing tests
  // Override modeId to 'maintain' in the viewModel mock
  // Set guidanceSettings.enableInMaintain = false via PersistenceService mock
  // Render <ActiveSessionView /> (or full <SessionView /> with mocked session state)
  
  // Assert:
  expect(screen.queryByRole('region', { name: /Quick Tips|Deep Dive/i }))
    .not.toBeInTheDocument()
})
```

Adapt the mock setup to match what the existing tests do — don't invent a new pattern.

**Step 3: Implement in ActiveSessionView**

In `ActiveSessionView` (inside `SessionView.tsx`), after the `guidanceSettings` state and `useEffect`:

```tsx
// Determine whether to show guidance panel
const showGuidance = !(viewModel.modeId === 'maintain' && !guidanceSettings.enableInMaintain)
```

In the JSX, wrap `<GuidancePanel>`:

```tsx
{/* Guidance Panel - Fixed at bottom */}
{showGuidance && (
  <GuidancePanel
    settings={guidanceSettings}
    onSettingsChange={handleGuidanceSettingsChange}
    currentPhaseTips={currentPhaseTips}
  />
)}

{/* Also adjust the bottom padding on main — only when guidance is shown */}
<main className={`flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 ${showGuidance ? 'pb-[360px]' : 'pb-8'}`}>
```

**Step 4: Run tests**

```bash
npm run test:run src/components/__tests__/SessionView.test.tsx
```

Expected: All pass including new test.

**Step 5: Full suite + typecheck**

```bash
npm run test:run 2>&1 | tail -5
npm run typecheck 2>&1 | grep "error" | wc -l
```

Expected: 37+ passed, 0 errors.

**Step 6: Commit**

```bash
git add src/components/SessionView.tsx src/components/__tests__/SessionView.test.tsx
git commit -m "feat: hide GuidancePanel in Maintain mode when enableInMaintain is false"
```

---

### Sprint 1 — Verification + Code Review

**Step 1: Full verification**

```bash
npm run typecheck 2>&1 | grep "error TS" | wc -l   # must be 0
npm run test:run 2>&1 | tail -6                      # all files pass
npm run build 2>&1 | tail -5                         # no build errors
```

**Step 2: Code review**

Invoke `/code-review-ai-ai-review` (or run the `code-review-ai-ai-review` skill).

For each CRITICAL/HIGH finding: fix immediately, commit, re-run tests.
For each LOW/INFO finding: note in a comment or backlog item.

**Step 3: Ship**

```bash
/ship
```

---

## Sprint 2 — Phase 11: Participant Personalization Complete

**Sprint goal:** Custom participant names/colors configurable via setup modal, background transitions by speaker, PhaseIndicator shows custom names. All Phase 11 tests pass.

**Files touched in this sprint:**
- `src/utils/colorContrast.ts` → Task 2.1 (new)
- `src/utils/__tests__/colorContrast.test.ts` → Task 2.1 (new)
- `src/viewmodels/SessionViewModel.ts` → Task 2.2 (extend interface + factory)
- `src/hooks/useParticipantBackground.ts` → Task 2.3 (new)
- `src/hooks/__tests__/useParticipantBackground.test.ts` → Task 2.3 (new)
- `src/components/SessionView.tsx` → Task 2.4 (ModeSelectionView + ActiveSessionView — one open)
- `src/components/__tests__/SessionSetup.test.tsx` → Task 2.4 (new)
- `src/components/PhaseIndicator.tsx` → Task 2.5
- `src/__tests__/participantPersonalization.integration.test.tsx` → Task 2.6 (new)

---

### Task 2.1 — colorContrast utility (full TDD)

**Files:**
- Create: `src/utils/colorContrast.ts`
- Create: `src/utils/__tests__/colorContrast.test.ts`

**Step 1: Create the test file first**

```bash
mkdir -p src/utils/__tests__
```

Create `src/utils/__tests__/colorContrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  calculateLuminance,
  calculateContrastRatio,
  getContrastingTextColor,
} from '../colorContrast'

describe('hexToRgb', () => {
  it('converts 6-digit hex with hash', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 })
  })

  it('converts hex without hash', () => {
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe('calculateLuminance', () => {
  it('returns 1 for white', () => {
    expect(calculateLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1)
  })
  it('returns 0 for black', () => {
    expect(calculateLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0)
  })
})

describe('calculateContrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
  it('returns 1 for identical colors', () => {
    expect(calculateContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1)
  })
  it('is commutative', () => {
    const ab = calculateContrastRatio('#3b82f6', '#ffffff')
    const ba = calculateContrastRatio('#ffffff', '#3b82f6')
    expect(ab).toBeCloseTo(ba)
  })
})

describe('getContrastingTextColor', () => {
  it('returns dark color for light background', () => {
    expect(getContrastingTextColor('#ffffff')).toBe('#111827')
    expect(getContrastingTextColor('#f3f4f6')).toBe('#111827')
  })
  it('returns light color for dark background', () => {
    expect(getContrastingTextColor('#000000')).toBe('#f9fafb')
    expect(getContrastingTextColor('#1f2937')).toBe('#f9fafb')
  })
})

// meetsContrastRequirement omitted — YAGNI until a caller exists
```

**Step 2: Run and verify all fail**

```bash
npm run test:run src/utils/__tests__/colorContrast.test.ts
```

Expected: FAIL — "Cannot find module '../colorContrast'".

**Step 3: Implement colorContrast.ts**

Create `src/utils/colorContrast.ts`:

```ts
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

export function calculateLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = calculateLuminance(hexToRgb(color1))
  const l2 = calculateLuminance(hexToRgb(color2))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getContrastingTextColor(bgColor: string): '#111827' | '#f9fafb' {
  const luminance = calculateLuminance(hexToRgb(bgColor))
  return luminance > 0.179 ? '#111827' : '#f9fafb'
}

// meetsContrastRequirement: add only when a caller exists (YAGNI)
```

**Step 4: Run tests**

```bash
npm run test:run src/utils/__tests__/colorContrast.test.ts
```

Expected: All pass.

**Step 5: Full suite**

```bash
npm run test:run 2>&1 | tail -5
```

Expected: 38 passed (1 new file).

**Step 6: Commit**

```bash
git add src/utils/colorContrast.ts src/utils/__tests__/colorContrast.test.ts
git commit -m "feat: WCAG-compliant colorContrast utility (TDD, 7 tests)"
```

---

### Task 2.2 — Extend SessionViewModel with participant names + colors

**Files:**
- Modify: `src/viewmodels/SessionViewModel.ts`

**Context:** `createSessionViewModel(state, participantConfig)` already receives `participantConfig` but only uses it for `speakerDisplayName`. We need `participantNameA/B` and `participantColorA/B` in the interface for the hook and PhaseIndicator to consume.

**Step 1: Write the failing test**

Run existing ViewModel tests first to understand test pattern:
```bash
ls src/viewmodels/__tests__/ 2>/dev/null || echo "no viewmodel tests"
```

If no tests exist, the typecheck will serve as the guardrail after implementation.

**Step 2: Add to SessionViewModel interface**

In `src/viewmodels/SessionViewModel.ts`, inside the `SessionViewModel` interface, add after the speaker block:

```ts
// Participant info
participantNameA: string
participantNameB: string
participantColorA: string
participantColorB: string
```

**Step 3: Add to createSessionViewModel factory**

In `createSessionViewModel`, inside the returned object, add after the speaker block:

```ts
// Participant info
participantNameA: participantConfig?.nameA ?? 'Partner A',
participantNameB: participantConfig?.nameB ?? 'Partner B',
participantColorA: participantConfig?.colorA ?? '#3b82f6',
participantColorB: participantConfig?.colorB ?? '#10b981',
```

**Step 4: Verify typecheck**

```bash
npm run typecheck 2>&1 | grep "SessionViewModel"
```

Expected: 0 errors.

**Step 5: Run full suite**

```bash
npm run test:run 2>&1 | tail -5
```

Expected: same count passed (no tests should break — additive change).

**Step 6: Commit**

```bash
git add src/viewmodels/SessionViewModel.ts
git commit -m "feat: expose participantNameA/B and participantColorA/B in SessionViewModel"
```

---

### Task 2.3 — useParticipantBackground hook (TDD)

**Files:**
- Create: `src/hooks/useParticipantBackground.ts`
- Create: `src/hooks/__tests__/useParticipantBackground.test.ts`

**Step 0: Verify useSessionViewModel is exported from SessionContext**

```bash
grep -n "export.*useSessionViewModel\|export function useSessionViewModel\|export const useSessionViewModel" src/contexts/SessionContext.tsx
```

If not found, check for an alternative selector hook (e.g., `useSession` + a selector). Adapt the mock path in the test accordingly — the mock target must match the actual import path used in `useParticipantBackground.ts`.

**Step 1: Write the failing tests**

Create `src/hooks/__tests__/useParticipantBackground.test.ts`:

```tsx
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock SessionContext to control phase type and colors
vi.mock('../../contexts/SessionContext', () => ({
  useSessionViewModel: vi.fn(),
}))

import { useSessionViewModel } from '../../contexts/SessionContext'
import { useParticipantBackground } from '../useParticipantBackground'

const mockViewModel = (overrides = {}) => ({
  isRunning: true,
  isSpeakerA: false,
  isSpeakerB: false,
  participantColorA: '#3b82f6',
  participantColorB: '#10b981',
  ...overrides,
})

describe('useParticipantBackground', () => {
  it('returns null background when session is not running', () => {
    vi.mocked(useSessionViewModel).mockReturnValue(mockViewModel({ isRunning: false }) as any)
    const { result } = renderHook(() => useParticipantBackground())
    expect(result.current.backgroundColor).toBeNull()
  })

  it('returns colorA when Partner A is speaking', () => {
    vi.mocked(useSessionViewModel).mockReturnValue(mockViewModel({ isSpeakerA: true }) as any)
    const { result } = renderHook(() => useParticipantBackground())
    expect(result.current.backgroundColor).toBe('#3b82f6')
  })

  it('returns colorB when Partner B is speaking', () => {
    vi.mocked(useSessionViewModel).mockReturnValue(mockViewModel({ isSpeakerB: true }) as any)
    const { result } = renderHook(() => useParticipantBackground())
    expect(result.current.backgroundColor).toBe('#10b981')
  })

  it('returns null background during non-speaking phase', () => {
    vi.mocked(useSessionViewModel).mockReturnValue(
      mockViewModel({ isSpeakerA: false, isSpeakerB: false }) as any
    )
    const { result } = renderHook(() => useParticipantBackground())
    expect(result.current.backgroundColor).toBeNull()
  })

  it('returns a valid textColor for contrast', () => {
    vi.mocked(useSessionViewModel).mockReturnValue(mockViewModel({ isSpeakerA: true }) as any)
    const { result } = renderHook(() => useParticipantBackground())
    expect(['#111827', '#f9fafb']).toContain(result.current.textColor)
  })
})
```

**Step 2: Run and verify failure**

```bash
npm run test:run src/hooks/__tests__/useParticipantBackground.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the hook**

Create `src/hooks/useParticipantBackground.ts`:

```ts
import { useMemo } from 'react'
import { useSessionViewModel } from '../contexts/SessionContext'
import { getContrastingTextColor } from '../utils/colorContrast'

export interface ParticipantBackground {
  backgroundColor: string | null
  textColor: string
}

export function useParticipantBackground(): ParticipantBackground {
  const viewModel = useSessionViewModel()

  return useMemo(() => {
    if (!viewModel.isRunning) {
      return { backgroundColor: null, textColor: '#111827' }
    }

    if (viewModel.isSpeakerA) {
      const bg = viewModel.participantColorA
      return { backgroundColor: bg, textColor: getContrastingTextColor(bg) }
    }

    if (viewModel.isSpeakerB) {
      const bg = viewModel.participantColorB
      return { backgroundColor: bg, textColor: getContrastingTextColor(bg) }
    }

    return { backgroundColor: null, textColor: '#111827' }
  }, [
    viewModel.isRunning,
    viewModel.isSpeakerA,
    viewModel.isSpeakerB,
    viewModel.participantColorA,
    viewModel.participantColorB,
  ])
}
```

**Step 4: Run tests**

```bash
npm run test:run src/hooks/__tests__/useParticipantBackground.test.ts
```

Expected: 5 passed.

**Step 5: Full suite + typecheck**

```bash
npm run test:run 2>&1 | tail -5
npm run typecheck 2>&1 | grep "error" | wc -l
```

Expected: all pass, 0 errors.

**Step 6: Commit**

```bash
git add src/hooks/useParticipantBackground.ts src/hooks/__tests__/useParticipantBackground.test.ts
git commit -m "feat: useParticipantBackground hook — derives bg/text from active speaker (TDD)"
```

---

### Task 2.4 — Wire SessionSetup modal + write tests + dynamic background

This task touches `SessionView.tsx` twice (ModeSelectionView for setup modal, ActiveSessionView for dynamic background) — do both in one open to avoid reopening.

**Context:** `SessionSetup` props are `{ config: ParticipantConfig, onSave: (config) => void, onCancel: () => void }` — it renders its own backdrop when mounted.

**Files:**
- Create: `src/components/__tests__/SessionSetup.test.tsx`
- Modify: `src/components/SessionView.tsx`

**Step 1: Read SessionSetup.tsx fully**

```bash
cat -n src/components/SessionSetup.tsx
```

Understand the full component: save button text, cancel button text, what i18n keys it uses.

**Step 2: Write SessionSetup tests**

Create `src/components/__tests__/SessionSetup.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import SessionSetup from '../SessionSetup'
import { createDefaultParticipantConfig } from '../../domain/ParticipantConfig'

const defaultConfig = createDefaultParticipantConfig()

describe('SessionSetup', () => {
  it('renders participant name inputs', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SessionSetup config={defaultConfig} onSave={vi.fn()} onCancel={vi.fn()} />
      </I18nextProvider>
    )
    // Input for Partner A name should be visible
    expect(screen.getByDisplayValue('Partner A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Partner B')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <SessionSetup config={defaultConfig} onSave={vi.fn()} onCancel={onCancel} />
      </I18nextProvider>
    )
    // Find cancel button (use getByRole or text — read actual button text from SessionSetup.tsx)
    const cancelBtn = screen.getByRole('button', { name: /cancel|abbrechen/i })
    fireEvent.click(cancelBtn)
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce())
  })

  it('calls onSave with updated config when save button clicked', async () => {
    const onSave = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <SessionSetup config={defaultConfig} onSave={onSave} onCancel={vi.fn()} />
      </I18nextProvider>
    )
    const nameInput = screen.getByDisplayValue('Partner A')
    fireEvent.change(nameInput, { target: { value: 'Alex' } })

    const saveBtn = screen.getByRole('button', { name: /save|speichern|session setup/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ nameA: 'Alex' })
      )
    })
  })

  it('calls onSave with default config when names not changed', async () => {
    const onSave = vi.fn()
    render(
      <I18nextProvider i18n={i18n}>
        <SessionSetup config={defaultConfig} onSave={onSave} onCancel={vi.fn()} />
      </I18nextProvider>
    )
    const saveBtn = screen.getByRole('button', { name: /save|speichern|session setup/i })
    fireEvent.click(saveBtn)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        nameA: expect.any(String),
        colorA: expect.any(String),
      }))
    })
  })
})
```

**Step 3: Run and identify actual button text**

```bash
npm run test:run src/components/__tests__/SessionSetup.test.tsx
```

If role/text selectors miss, read `SessionSetup.tsx` save button label and adjust the test regex accordingly.

**Step 3.5: Check if StartButton already accepts onClick**

```bash
grep -n "onClick\|interface.*Props\|type.*Props" src/components/StartButton.tsx | head -15
```

- If `StartButton` has an `onClick` prop → pass `onClick={handleStartClick}` to existing `<StartButton>`, do NOT replace it.
- If not → replace with inline button as shown below.

**Step 4: Wire SessionSetup into ModeSelectionView**

In `SessionView.tsx`, in `ModeSelectionView`:

```tsx
// Add imports at top of file (if not already present):
import SessionSetup from './SessionSetup'
import { ParticipantConfig } from '../domain/ParticipantConfig'
import { participantPersistenceService } from '../services/ParticipantPersistenceService'

// Add state inside ModeSelectionView:
const [setupOpen, setSetupOpen] = useState(false)
// Load config once on mount — NOT on every render (avoids repeated localStorage reads)
const [savedParticipantConfig] = useState(() => participantPersistenceService.loadConfig())
const { start } = useSession()

const handleStartClick = () => {
  if (selectedMode) setSetupOpen(true)
}

const handleSetupSave = (config: ParticipantConfig) => {
  if (selectedMode) {
    participantPersistenceService.saveConfig(config)
    start(selectedMode, config)
    setSetupOpen(false)
  }
}

// If StartButton has no onClick prop, replace with:
<button
  onClick={handleStartClick}
  disabled={!selectedMode}
  className="w-full px-6 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {t('session.start', 'Start Session')}
</button>

// Add SessionSetup to JSX (before or after footer, it renders its own backdrop):
{setupOpen && (
  <SessionSetup
    config={savedParticipantConfig}
    onSave={handleSetupSave}
    onCancel={() => setSetupOpen(false)}
  />
)}
```

**Step 5: Wire dynamic background in ActiveSessionView**

In `ActiveSessionView` (same file, different function):

```tsx
// Add import at top:
import { useParticipantBackground } from '../hooks/useParticipantBackground'

// Inside ActiveSessionView body:
const { backgroundColor, textColor } = useParticipantBackground()

// Wrap the outermost div in motion.div:
// Before:
// <div className="flex flex-col min-h-screen">
// After:
<motion.div
  className="flex flex-col min-h-screen"
  animate={{
    backgroundColor: backgroundColor ?? (document.documentElement.classList.contains('dark')
      ? '#111827' : '#ffffff'),
  }}
  transition={{ duration: 1.2, ease: 'easeInOut' }}
>
```

**Step 6: Run full suite + typecheck**

```bash
npm run test:run 2>&1 | tail -5
npm run typecheck 2>&1 | grep "error" | wc -l
```

Expected: all pass, 0 errors.

**Step 7: Commit**

```bash
git add src/components/SessionView.tsx src/components/__tests__/SessionSetup.test.tsx
git commit -m "feat: SessionSetup modal wired into start flow, dynamic background by speaker (Phase 11)"
```

---

### Task 2.5 — PhaseIndicator shows custom participant names

**Files:**
- Modify: `src/components/PhaseIndicator.tsx`

**Step 1: Read PhaseIndicator**

```bash
cat -n src/components/PhaseIndicator.tsx
```

Find where "Partner A" / "Partner B" are hardcoded or where `viewModel.speakerDisplayName` is used.

**Step 2: Write failing test (if PhaseIndicator tests exist)**

```bash
ls src/components/__tests__/ | grep -i phase
```

If `PhaseIndicator.test.tsx` exists, add:
```tsx
it('shows custom participant name from session config', () => {
  // mock viewModel.participantNameA = 'Alex'
  // render PhaseIndicator
  // expect 'Alex' in document
})
```

If no test file: create `src/components/__tests__/PhaseIndicator.test.tsx` with this test.

**Step 3: Replace hardcoded names**

In `PhaseIndicator.tsx`, replace any hardcoded "Partner A" / "Partner B" strings:
```tsx
// Before
<span>Partner A</span>

// After
<span>{viewModel.participantNameA}</span>
```

`viewModel.speakerDisplayName` already does this for the current speaker — check if it's sufficient or if both names need to appear.

**Step 4: Run full suite**

```bash
npm run test:run 2>&1 | tail -5
```

**Step 5: Commit**

```bash
git add src/components/PhaseIndicator.tsx src/components/__tests__/PhaseIndicator.test.tsx
git commit -m "feat: PhaseIndicator shows custom participant names (Phase 11)"
```

---

### Task 2.6 — Phase 11 integration test

**Files:**
- Create: `src/__tests__/participantPersonalization.integration.test.tsx`

**Step 1: Write the integration test**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import { SessionProvider } from '../contexts/SessionContext'
import SessionView from '../components/SessionView'

describe('Participant Personalization Integration', () => {
  it('setup modal appears after clicking Start, names persist into session', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          <SessionView />
        </SessionProvider>
      </I18nextProvider>
    )

    // Select Commitment mode (first available mode card)
    const commitmentCard = screen.getByText(/Commitment/i)
    fireEvent.click(commitmentCard)

    // Click the Start button
    await waitFor(() => {
      const startBtn = screen.getByRole('button', { name: /Start Session|Sitzung starten/i })
      fireEvent.click(startBtn)
    })

    // Setup modal should appear
    await waitFor(() => {
      expect(screen.getByDisplayValue('Partner A')).toBeInTheDocument()
    })

    // Change Partner A name
    fireEvent.change(screen.getByDisplayValue('Partner A'), { target: { value: 'Alex' } })

    // Confirm / save
    const saveBtn = screen.getByRole('button', { name: /save|speichern/i })
    fireEvent.click(saveBtn)

    // Session should start — PhaseIndicator shows custom name
    await waitFor(() => {
      // Positive assertion: custom name appears (more robust than checking absence of default)
      expect(screen.getByText('Alex')).toBeInTheDocument()
    })
  })
})
```

**Step 2: Run, iterate until green**

```bash
npm run test:run src/__tests__/participantPersonalization.integration.test.tsx
```

Adapt mock/setup if needed. Do NOT skip or `.skip` this test.

**Step 3: Full suite**

```bash
npm run test:run 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add src/__tests__/participantPersonalization.integration.test.tsx
git commit -m "test: Phase 11 integration — participant personalization end-to-end"
```

---

### Sprint 2 — Verification + Code Review

**Step 1: Full verification**

```bash
npm run typecheck 2>&1 | grep "error TS" | wc -l   # 0
npm run test:run 2>&1 | tail -6                      # all pass
npm run build 2>&1 | tail -5                         # no errors
```

**Step 2: Manual browser test (mandatory)**

```bash
npm run dev
```

Verify in browser:
- Select Commitment mode → click Start → Setup modal appears
- Enter "Alex" for Partner A, "Jordan" for Partner B, pick different colors
- Click Save → session starts
- During SlotA: background transitions to Alex's color
- During SlotB: background transitions to Jordan's color
- PhaseIndicator shows "Alex" not "Partner A"
- Language switch (DE/EN) works throughout
- Maintain mode: start session → GuidancePanel not visible (when `enableInMaintain` is false)
- Dark mode: contrast ratios are readable (white text on dark colors, dark text on light colors)

**Step 3: Code review**

Invoke `/code-review-ai-ai-review`.

Fix CRITICAL/HIGH immediately. Document LOW/INFO.

**Step 4: Ship**

```bash
/ship
```

---

## Sprint 3 — VibeMind Audio Recording (Frontend Only)

**Sprint goal:** CoupleTimer records session audio using MediaRecorder, tracks phase transitions in a timeline, stores audio blob for download when session ends. Backend not required — download acts as placeholder until upload endpoint exists.

**Design rationale:** Download-on-stop is not the final UX but it proves the pipeline end-to-end and lets us record and inspect real audio before VibeMind backend exists.

**Files touched:**
- `src/services/AudioRecorderService.ts` → Task 3.1 (new)
- `src/services/__tests__/AudioRecorderService.test.ts` → Task 3.1 (new)
- `src/contexts/SessionContext.tsx` → Task 3.2 (wire recorder lifecycle)
- `src/components/SessionView.tsx` → Task 3.3 (recording badge — one open)

---

### Task 3.1 — AudioRecorderService (TDD)

**Files:**
- Create: `src/services/AudioRecorderService.ts`
- Create: `src/services/__tests__/AudioRecorderService.test.ts`

**Step 1: Write failing tests**

Create `src/services/__tests__/AudioRecorderService.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioRecorderService } from '../AudioRecorderService'

// MediaRecorder mock
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  state: 'inactive',
  ondataavailable: null as any,
  onstop: null as any,
  stream: { getTracks: () => [{ stop: vi.fn() }] },
}

beforeEach(() => {
  // MediaRecorder.isTypeSupported is a static method — must be stubbed explicitly
  const MediaRecorderMock = vi.fn(() => mockMediaRecorder) as any
  MediaRecorderMock.isTypeSupported = vi.fn().mockReturnValue(true)
  vi.stubGlobal('MediaRecorder', MediaRecorderMock)
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AudioRecorderService', () => {
  it('starts and tracks a phase timeline entry', async () => {
    const service = new AudioRecorderService()
    await service.start()
    service.markPhaseStart('slotA', 0, 'A')
    service.markPhaseEnd('slotA', 30000)

    const timeline = service.getPhaseTimeline()
    expect(timeline).toHaveLength(1)
    expect(timeline[0]).toMatchObject({
      phase: 'slotA',
      expectedSpeaker: 'A',
      startMs: 0,
      endMs: 30000,
    })
  })

  it('tracks multiple sequential phases', async () => {
    const service = new AudioRecorderService()
    await service.start()
    service.markPhaseStart('prep', 0, null)
    service.markPhaseEnd('prep', 5000)
    service.markPhaseStart('slotA', 5000, 'A')
    service.markPhaseEnd('slotA', 35000)

    expect(service.getPhaseTimeline()).toHaveLength(2)
  })

  it('stop() returns blob and timeline', async () => {
    const service = new AudioRecorderService()
    await service.start()

    // Simulate onstop firing after stop() is called
    const stopPromise = service.stop()
    mockMediaRecorder.onstop?.({} as any)

    const result = await stopPromise
    expect(result.blob).toBeInstanceOf(Blob)
    expect(result.timeline).toBeInstanceOf(Array)
    expect(typeof result.durationMs).toBe('number')
  })

  it('returns empty result if stop() called before start()', async () => {
    const service = new AudioRecorderService()
    const result = await service.stop()
    expect(result.blob.size).toBe(0)
  })
})
```

**Step 2: Run and verify failure**

```bash
npm run test:run src/services/__tests__/AudioRecorderService.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement AudioRecorderService**

Create `src/services/AudioRecorderService.ts`:

```ts
export interface PhaseTimelineEntry {
  phase: string
  expectedSpeaker: 'A' | 'B' | null
  startMs: number
  endMs: number | null
}

export interface RecordingResult {
  blob: Blob
  timeline: PhaseTimelineEntry[]
  durationMs: number
}

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private timeline: PhaseTimelineEntry[] = []
  private startTime = 0

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
    })
    this.chunks = []
    this.timeline = []
    this.startTime = Date.now()

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.mediaRecorder.start(1000)
  }

  markPhaseStart(phase: string, elapsedMs: number, speaker: 'A' | 'B' | null = null): void {
    this.timeline.push({ phase, expectedSpeaker: speaker, startMs: elapsedMs, endMs: null })
  }

  markPhaseEnd(phase: string, elapsedMs: number): void {
    const entry = [...this.timeline].reverse().find((e) => e.phase === phase && e.endMs === null)
    if (entry) entry.endMs = elapsedMs
  }

  getPhaseTimeline(): PhaseTimelineEntry[] {
    return [...this.timeline]
  }

  async stop(): Promise<RecordingResult> {
    if (!this.mediaRecorder) {
      return { blob: new Blob(), timeline: [], durationMs: 0 }
    }
    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' })
        resolve({ blob, timeline: this.timeline, durationMs: Date.now() - this.startTime })
      }
      this.mediaRecorder!.stop()
      this.mediaRecorder!.stream.getTracks().forEach((t) => t.stop())
    })
  }
}
```

**Step 4: Run tests**

```bash
npm run test:run src/services/__tests__/AudioRecorderService.test.ts
```

Expected: 4 passed.

**Step 5: Full suite + typecheck**

```bash
npm run test:run 2>&1 | tail -5
npm run typecheck 2>&1 | grep "error" | wc -l
```

**Step 6: Commit**

```bash
git add src/services/AudioRecorderService.ts src/services/__tests__/AudioRecorderService.test.ts
git commit -m "feat: AudioRecorderService — MediaRecorder with phase timeline (TDD, 4 tests)"
```

---

### Task 3.2 — Wire AudioRecorder into SessionContext

**Files:**
- Modify: `src/contexts/SessionContext.tsx`

**Context:** SessionContext already has `start/pause/resume/stop` callbacks. SessionEngine emits state on every tick via `subscribe` — we can derive phase transitions by comparing previous/current phase index in the subscription callback.

**Step 1: Read the subscription/state-change pattern**

```bash
grep -n "subscribe\|setState\|currentPhaseIndex\|onStateChange" src/contexts/SessionContext.tsx | head -20
```

**Step 1.5: Verify SessionState field name for elapsed time**

```bash
grep -n "elapsed\|currentPhaseIndex\|phaseIndex" src/domain/SessionState.ts | head -10
```

Note the exact field name for elapsed time (likely `elapsed`, not `elapsedSessionTime`). Use it in Step 4 below.

**Step 2: Add AudioRecorderService to SessionContext**

```tsx
// Add imports
import { AudioRecorderService } from '../services/AudioRecorderService'
import { isPartnerAPhase, isPartnerBPhase } from '../domain/PhaseType'

// Add ref inside SessionProvider
const audioRecorderRef = useRef(new AudioRecorderService())
const [isRecording, setIsRecording] = useState(false)
const lastPhaseIndexRef = useRef(-1)
```

**Step 3: Hook into start/stop**

In the `start` callback, after the engine starts:
```ts
// After engine.start(mode, config):
try {
  await audioRecorderRef.current.start()
  setIsRecording(true)
  lastPhaseIndexRef.current = -1
} catch {
  // Mic permission denied — session continues without recording
  setIsRecording(false)
}
```

In the `stop` callback, before returning:
```ts
if (isRecording) {
  const result = await audioRecorderRef.current.stop()
  setIsRecording(false)
  // Trigger download (placeholder until VibeMind upload endpoint)
  if (result.blob.size > 0) {
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${Date.now()}.webm`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
```

**Step 4: Track phase transitions in the subscription callback**

In the state subscription handler (where `setState` or `setSession` is called), add:

```ts
// Detect phase change
// NOTE: use exact field name from Step 1.5 grep — likely 'elapsed', not 'elapsedSessionTime'
const newPhaseIndex = newState.currentPhaseIndex
if (isRecording && newPhaseIndex !== lastPhaseIndexRef.current) {
  const prevPhase = newState.mode?.phases[lastPhaseIndexRef.current]
  const newPhase = newState.mode?.phases[newPhaseIndex]
  const elapsed = Math.round((newState.elapsed ?? 0) * 1000)

  if (prevPhase && lastPhaseIndexRef.current >= 0) {
    audioRecorderRef.current.markPhaseEnd(prevPhase.type, elapsed)
  }
  if (newPhase) {
    // Use confirmed PhaseType helpers — getSpeakerForPhase does NOT exist
    const speaker = isPartnerAPhase(newPhase.type)
      ? 'A'
      : isPartnerBPhase(newPhase.type)
        ? 'B'
        : null
    audioRecorderRef.current.markPhaseStart(newPhase.type, elapsed, speaker)
  }
  lastPhaseIndexRef.current = newPhaseIndex
}
```

**Step 5: Expose isRecording in context value**

Add `isRecording: boolean` to the context value type and return it.

**Step 6: Run tests**

```bash
npm run test:run 2>&1 | tail -5
npm run typecheck 2>&1 | grep "error" | wc -l
```

**Step 7: Commit**

```bash
git add src/contexts/SessionContext.tsx
git commit -m "feat: auto-record session audio via SessionContext, download on stop (VibeMind stub)"
```

---

### Task 3.3 — Recording indicator in ActiveSessionView

**Files:**
- Modify: `src/components/SessionView.tsx` (ActiveSessionView header only)

**Step 1: Read isRecording from context**

```tsx
const { isRecording } = useSession()
```

**Step 2: Add recording badge to ActiveSessionView header**

In the `<header>` div inside `ActiveSessionView`, after the elapsed time span:

```tsx
{isRecording && (
  <div className="flex items-center gap-1 text-red-500 text-xs font-medium" aria-label="Recording active">
    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
    REC
  </div>
)}
```

**Step 3: Run full suite + typecheck**

```bash
npm run test:run 2>&1 | tail -5
npm run typecheck 2>&1 | grep "error" | wc -l
```

**Step 4: Commit**

```bash
git add src/components/SessionView.tsx
git commit -m "feat: REC indicator badge in session header when audio recording is active"
```

---

### Sprint 3 — Verification + Code Review

**Step 1: Full verification**

```bash
npm run typecheck 2>&1 | grep "error TS" | wc -l   # 0
npm run test:run 2>&1 | tail -6                      # all pass
npm run build 2>&1 | tail -5                         # no errors
```

**Step 2: Manual browser test (mandatory)**

```bash
npm run dev
```

Verify:
- Start a session → browser prompts for microphone permission
- Accept → red blinking REC badge appears in header
- Complete session → `.webm` file downloads automatically
- Deny mic permission → no REC badge, session runs normally (no crash)
- Download the `.webm` → open in VLC/QuickTime → audio is audible

**Step 3: Code review**

Invoke `/code-review-ai-ai-review`.

Fix CRITICAL/HIGH findings. Pay special attention to:
- `URL.createObjectURL` cleanup (memory leak risk)
- Session abort before stop (dangling recorder)
- Pause/resume — does the recorder need to pause too?

**Step 4: Ship**

```bash
/ship
```

---

## Out of Scope (Future Plans)

| Item | Why deferred |
|---|---|
| VibeMind backend (FastAPI, SQLite, workers) | Separate greenfield plan — `apps/backend/` doesn't exist |
| Deepgram/pyannote integration | Requires backend |
| Review UI (transcript correction, speaker reassignment) | Requires backend + transcription |
| LLM summary generation | Requires backend |
| Monorepo restructure (`apps/frontend/`) | Destructive atomic commit — plan separately |
| Pause/resume of audio recording | Nice-to-have; YAGNI until backend validates |
| MediaRecorder to IndexedDB (survive page refresh) | YAGNI until upload endpoint exists |

---

## Definition of Done (all sprints)

- [ ] `npm run typecheck` returns 0 errors
- [ ] `npm run test:run` all files pass (no `.skip` added)
- [ ] `npm run build` succeeds without error
- [ ] Manual browser test completed for the sprint's features
- [ ] `/code-review-ai-ai-review` run, CRITICAL/HIGH findings fixed
- [ ] Changes pushed to `main`

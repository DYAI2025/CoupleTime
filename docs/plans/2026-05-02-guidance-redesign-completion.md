# Guidance Panel Redesign Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the abandoned `feature/phase-10-guidance-overhaul` redesign so the deployed app stops crashing mid-session, all 5 currently-failing test files go green, and the GuidancePanel matches what the existing tests describe — with real working code, no placeholders, no skipped tests.

**Architecture:** The redesign is half-built. Working pieces already on `main`: structured `guidance.deepDive.{beforeSession,duringListening,emergency}` i18n keys with `{title, cards: [{title, content, icon}]}` shape, `GuidanceSettings.guidanceMode: 'quick' | 'deep-dive'` field, `useTipRotation` hook, and a 360 px layout reservation in `SessionView`. Missing/wrong: (a) `DeepDiveView` is the wrong implementation (renders generic tips, must render 3-phase-section card layout from i18n with icon mapping), (b) `QuickTipsView` doesn't use `useTipRotation` and has wrong props, (c) `GuidancePanel` is the old design (Auto-rotate / Show-all checkboxes) without the Quick/Deep mode-toggle header, (d) `SessionView` passes `currentPhaseTips` (silently dropped) and doesn't wire `onSettingsChange` to persistence. We rewrite (a)–(c) to match the existing test spec, wire (d), and add a `typecheck` script so this kind of TypeScript prop-mismatch can't ship silently again.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind 3.4, Framer Motion 12, react-i18next, lucide-react (already in node_modules — verify), Vitest 4 + Testing Library, ESLint 9.

**Source-of-truth specs (read these before each phase):**
- `src/components/__tests__/QuickTipsView.test.tsx` — 9 tests, defines QuickTipsView contract
- `src/components/__tests__/DeepDiveView.test.tsx` — 7 tests, defines DeepDiveView contract
- `src/components/__tests__/DeepDiveView.visual.test.tsx` — 3 tests, real-i18n integration
- `src/components/__tests__/Guidance.a11y.test.tsx` — 17 tests, a11y across all three components, also includes GuidancePanel contract
- `src/components/__tests__/SessionView.test.tsx` — 4 active tests + 5 currently `.skip`'d (we un-skip the persistence/mode-toggle ones)

**Out of scope:** Adding new translation keys (existing `guidance.deepDive.*` and `guidancePanel.*` keys are sufficient — verify in Phase 0). Adding new icon families (use Lucide React only). Changing `useTipRotation` (already correct). Migrating to a different i18n backend.

---

## Phase 0 — Baseline & guardrails

### Task 1: Confirm baseline failure state

**Files:** none (read-only)

**Step 1: Run the test suite**

Run: `npm run test:run 2>&1 | tail -10`

**Expected:**
```
 Test Files  5 failed | 32 passed (37)
      Tests  ~58 failed | ~402 passed | 6 skipped (~466)
```

The 5 failing files must be exactly these (in any order):
- `src/components/__tests__/SessionView.test.tsx`
- `src/components/__tests__/DeepDiveView.test.tsx`
- `src/components/__tests__/DeepDiveView.visual.test.tsx`
- `src/components/__tests__/QuickTipsView.test.tsx`
- `src/components/__tests__/Guidance.a11y.test.tsx`

If anything else is failing, **STOP and investigate** before proceeding — this plan addresses only the half-merged guidance overhaul.

**Step 2: Note no commit needed.** This is a baseline read.

---

### Task 2: Add `typecheck` script + tsc dev-dep check

**Why:** The whole reason this prop mismatch shipped is that `npm run build` (Vite + esbuild) and `npm run test:run` (Vitest + esbuild) don't invoke `tsc`. Future prop mismatches must fail loudly. One line in `package.json`.

**Files:**
- Modify: `package.json` (top-level)

**Step 1: Read current scripts block**

Run: `jq '.scripts' package.json`

**Step 2: Add a `typecheck` script**

Edit `package.json`. In `"scripts"`, after `"lint"`:

```json
"typecheck": "tsc -p tsconfig.app.json --noEmit",
```

Order in scripts block doesn't matter, but conventionally place between `lint` and `preview`.

**Step 3: Verify the script runs (and currently FAILS — that's expected, it's the canary)**

Run: `npm run typecheck 2>&1 | tail -30`

**Expected:** TS errors, including (verbatim or close):
- `src/components/SessionView.tsx(...): error TS2741: Property 'currentPhase' is missing in type '{ settings: GuidanceSettings; currentPhaseTips: string[]; }'`
- … and similar for `guidanceLevel`, `guidanceTexts`, `isVisible`, `onSettingsChange`, `onNextTip`, `onPreviousTip`
- Possibly TS errors in other files too

Note: `tsc` errors here are the canary — they WILL be resolved after Phase 3 / 4 land. Don't fix them now.

**Step 4: Commit**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
chore: add npm run typecheck script

Surfaces TypeScript prop-mismatches that Vite + esbuild silently strip.
Currently fails — exposes the half-merged GuidancePanel refactor that
this plan resolves. Will be wired into CI after the refactor lands.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Verify lucide-react availability

**Why:** `QuickTipsView.test.tsx` line 179-200 expects "Lucide icons (ChevronLeft, ChevronRight)". The current QuickTipsView uses inline-SVG icons. The new one must use Lucide.

**Files:** none (read-only)

**Step 1: Check whether `lucide-react` is in dependencies**

Run: `jq '.dependencies."lucide-react", .devDependencies."lucide-react"' package.json`

**Step 2: Branch on result:**

- If `lucide-react` is `null` in both → install: `npm install lucide-react`. Commit:
  ```bash
  git add package.json package-lock.json
  git commit -m "chore: add lucide-react for guidance redesign icons

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
  ```
- If installed → no action, no commit. Note version for the implementation tasks.

**Step 3: Verify import works**

Run: `node -e "const l = require('lucide-react'); console.log(typeof l.ChevronLeft, typeof l.ChevronRight)"`

**Expected:** `function function`

If imports fail, **STOP** and investigate (probably an ESM/CJS issue — may need to use `import { ChevronLeft } from 'lucide-react'` from a TS file under Vite, not Node).

---

## Phase 1 — Rewrite QuickTipsView

Reference spec: `src/components/__tests__/QuickTipsView.test.tsx` and the QuickTipsView blocks in `src/components/__tests__/Guidance.a11y.test.tsx` (lines 56-134, 264-278, 297-311).

### Task 4: Plan QuickTipsView contract from tests

**Files:** none (read-only)

**Step 1: Re-read both test files** to extract the contract:
- Props: `{ tips: string[], autoRotate: boolean, interval: number, shuffleMode: boolean }`
- Uses hook: `useTipRotation` from `../hooks/useTipRotation`
- Renders the `current` tip text
- Has Previous and Next buttons with `aria-label="Previous tip"` / `aria-label="Next tip"`
- Shows position: `"{currentIndex + 1} / {total}"` (e.g. `"3 / 5"`)
- Previous is disabled when `currentIndex === 0`
- Next is disabled when `currentIndex === total - 1`
- Click Previous → calls `previous()` from the hook
- Click Next → calls `next()` from the hook
- Renders Lucide `<ChevronLeft />` and `<ChevronRight />` (≥ 2 SVGs)
- When `tips` is empty array → returns `null` (the test asserts `container.firstChild` is null)
- Buttons are real `<button>` elements (test asserts `tagName === 'BUTTON'`)

**Step 2: No code yet, no commit.** This is the contract sheet for Task 5.

---

### Task 5: Rewrite `QuickTipsView.tsx`

**Files:**
- Modify: `src/components/QuickTipsView.tsx` (full rewrite)

**Step 1: Replace file content**

```tsx
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTipRotation } from '../hooks/useTipRotation'

export interface QuickTipsViewProps {
  tips: string[]
  autoRotate: boolean
  interval: number
  shuffleMode: boolean
}

export function QuickTipsView({
  tips,
  autoRotate,
  interval,
  shuffleMode,
}: QuickTipsViewProps) {
  const { t } = useTranslation()
  const { current, currentIndex, total, next, previous } = useTipRotation({
    tips,
    autoRotate,
    interval,
    shuffleMode,
  })

  if (tips.length === 0) {
    return null
  }

  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4">
      <p className="text-base text-gray-700 dark:text-gray-200 text-center min-h-[3rem]">
        {current}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={previous}
          disabled={isFirst}
          aria-label={t('tips.previous', 'Previous tip')}
          className={`
            p-2 rounded-full
            ${isFirst
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {currentIndex + 1} / {total}
        </span>

        <button
          type="button"
          onClick={next}
          disabled={isLast}
          aria-label={t('tips.next', 'Next tip')}
          className={`
            p-2 rounded-full
            ${isLast
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
```

**Critical notes:**
1. **Named export** (`export function QuickTipsView`), no default export — matches what `Guidance.a11y.test.tsx` does (named import).
2. **The aria-label is hardcoded** when the i18n key returns `undefined`. The a11y test (line 68-69) does `screen.getByLabelText('Previous tip')` — the test mocks `t()` which returns `options?.defaultValue || key`. So the second arg `'Previous tip'` must EXACTLY match what the test looks for. **Don't change the wording.**
3. **`disabled` on the buttons must be a boolean,** not a class — the test uses `expect(prevButton).toBeDisabled()` which checks the actual `disabled` attribute.
4. **No usage of session context.** The current QuickTipsView imports `useSession` — remove that dependency. Tips come purely from props.
5. **Lucide icons.** Use `<ChevronLeft />` and `<ChevronRight />` — they render as SVGs.

**Step 2: Run QuickTipsView unit tests**

Run: `npm run test:run -- src/components/__tests__/QuickTipsView.test.tsx 2>&1 | tail -30`

**Expected:** all 9 tests pass.

If any fail, READ the failure carefully:
- `screen.getByText('1 / 5')` not found → check the position-indicator format
- `screen.getByRole('button', { name: /previous/i })` not found → check the aria-label
- "icons" test fails → verify Lucide is imported correctly
- "renders null" fails → verify the `tips.length === 0` early-return

Iterate until all 9 pass before moving on.

**Step 3: Run the QuickTipsView slice of a11y tests**

Run: `npm run test:run -- src/components/__tests__/Guidance.a11y.test.tsx -t "QuickTipsView" 2>&1 | tail -30`

**Expected:** all 6 QuickTipsView a11y tests pass plus the keyboard-nav test.

**Step 4: Commit**

```bash
git add src/components/QuickTipsView.tsx
git commit -m "$(cat <<'EOF'
feat(guidance): rewrite QuickTipsView to test contract

Replaces the session-context-coupled implementation with a hook-driven
one (useTipRotation). New props { tips, autoRotate, interval, shuffleMode },
Lucide icons, proper disabled states, position indicator "N / total",
returns null on empty tips. Named export.

Resolves QuickTipsView.test.tsx (9 tests) and the QuickTipsView slice
of Guidance.a11y.test.tsx.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Rewrite DeepDiveView

Reference spec: `src/components/__tests__/DeepDiveView.test.tsx`, `DeepDiveView.visual.test.tsx`, and the DeepDiveView blocks in `Guidance.a11y.test.tsx` (lines 137-178, 313-321).

### Task 6: Verify the i18n keys exist with the right shape

**Files:** none (read-only)

**Step 1: Read English translations for `guidance.deepDive.*`**

Run: `jq '.guidance.deepDive' src/i18n/locales/en/translation.json`

**Expected:** an object with three keys (`beforeSession`, `duringListening`, `emergency`), each shaped:
```json
{
  "title": "...",
  "cards": [
    { "title": "...", "content": "...", "icon": "calendar" }
  ]
}
```

**Step 2: Same for German**

Run: `jq '.guidance.deepDive' src/i18n/locales/de/translation.json`

**Expected:** same shape, same icon strings (icon names are not translated).

**Step 3: Enumerate the icon strings in use**

Run:
```bash
jq -r '.guidance.deepDive | to_entries[] | .value.cards[]?.icon' \
  src/i18n/locales/en/translation.json | sort -u
```

**Expected output:** a list of icon strings like `calendar`, `heart`, `clock`, `door-closed`, possibly more. Note them — these are the icons we MUST map to Lucide components in Task 7.

**Step 4: If keys are missing or wrongly-shaped, STOP** and add them in a separate commit before proceeding. (They should already be correct — the brainstorm verified this — but trust-but-verify.)

**Step 5: No commit.**

---

### Task 7: Build the icon-string → Lucide-component map

**Files:**
- Create: `src/components/guidanceIcons.ts`

**Step 1: Inventory required Lucide icons**

For every icon string from Task 6 Step 3, pick the matching Lucide React export name. Mapping rule: kebab-case icon string → PascalCase Lucide name:
- `calendar` → `Calendar`
- `heart` → `Heart`
- `clock` → `Clock`
- `door-closed` → `DoorClosed`
- `pause` → `Pause`
- `users` → `Users`
- `message-circle` → `MessageCircle`
- `phone` → `Phone`
- `book-open` → `BookOpen`
- `shield` → `Shield`
- … etc. for whatever the i18n actually contains

If you encounter an icon string with no obvious Lucide match, fall back to `HelpCircle`. Don't invent new icons.

**Step 2: Write the file**

```ts
import type { ComponentType, SVGProps } from 'react'
import {
  Calendar,
  Heart,
  Clock,
  DoorClosed,
  Pause,
  Users,
  MessageCircle,
  Phone,
  BookOpen,
  Shield,
  HelpCircle,
  // ADD any others you discovered in Task 6 Step 3
} from 'lucide-react'

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

const ICON_MAP: Record<string, LucideIcon> = {
  calendar: Calendar,
  heart: Heart,
  clock: Clock,
  'door-closed': DoorClosed,
  pause: Pause,
  users: Users,
  'message-circle': MessageCircle,
  phone: Phone,
  'book-open': BookOpen,
  shield: Shield,
  // ADD others here matching Task 6 Step 3 inventory
}

export function getGuidanceIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? HelpCircle
}
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck 2>&1 | grep -E "guidanceIcons|error TS" | head -20`

**Expected:** no errors specifically about `guidanceIcons.ts`. The pre-existing GuidancePanel/SessionView errors are still present — that's fine, they're addressed in Phases 3-4.

**Step 4: Commit**

```bash
git add src/components/guidanceIcons.ts
git commit -m "$(cat <<'EOF'
feat(guidance): add icon-string to Lucide component map

Resolves icon strings from i18n deepDive content (calendar, heart, clock,
door-closed, …) to Lucide React components. Falls back to HelpCircle for
unknown strings.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Rewrite `DeepDiveView.tsx`

**Files:**
- Modify: `src/components/DeepDiveView.tsx` (full rewrite)

**Step 1: Replace file content**

```tsx
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { getGuidanceIcon } from './guidanceIcons'

interface DeepDiveCard {
  title: string
  content: string
  icon: string
}

interface DeepDiveSection {
  title: string
  cards: DeepDiveCard[]
}

const SECTION_KEYS = [
  'guidance.deepDive.beforeSession',
  'guidance.deepDive.duringListening',
  'guidance.deepDive.emergency',
] as const

export interface DeepDiveViewProps {
  tips: string[]
  showAllTips: boolean
}

export function DeepDiveView(_props: DeepDiveViewProps) {
  const { t } = useTranslation()

  const sections: DeepDiveSection[] = SECTION_KEYS.map((key) => {
    const value = t(key, { returnObjects: true }) as unknown
    if (
      value &&
      typeof value === 'object' &&
      'title' in value &&
      'cards' in value &&
      Array.isArray((value as DeepDiveSection).cards)
    ) {
      return value as DeepDiveSection
    }
    return { title: key, cards: [] }
  })

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {sections.map((section, sectionIdx) => (
        <section
          key={sectionIdx}
          className="space-y-3"
          aria-labelledby={`deep-dive-section-${sectionIdx}`}
        >
          <h2
            id={`deep-dive-section-${sectionIdx}`}
            className="text-lg font-semibold text-gray-800 dark:text-gray-100"
          >
            {section.title}
          </h2>

          {section.cards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.cards.map((card, cardIdx) => {
                const Icon = getGuidanceIcon(card.icon)
                return (
                  <motion.article
                    key={cardIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: cardIdx * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex gap-3"
                  >
                    <Icon
                      className="w-5 h-5 flex-shrink-0 text-indigo-500 dark:text-indigo-400 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {card.content}
                      </p>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
```

**Critical notes:**
1. **Named export** matching the test imports: `import { DeepDiveView } from '../DeepDiveView'`.
2. **Section title is `<h2>`** — a11y test asserts `getAllByRole('heading', { level: 2 }).length === 3`.
3. **Card title is `<h3>`** — a11y test asserts `getAllByRole('heading', { level: 3 })[0]` has text `'Schedule Agreement'`.
4. **Card has `bg-white` class** — visual test asserts `container.querySelectorAll('.bg-white').length > 0`.
5. **One SVG per card** — test "maps icon strings to SVG components" asserts `svgs.length === 3` for 3 cards. The Lucide icon is the only SVG in each card.
6. **Empty cards array gracefully handled** — section header still renders, no card grid.
7. **`tips` and `showAllTips` props are accepted but unused** — present in tests, might be wired later. Don't remove from interface.
8. **`returnObjects: true`** — the i18next call must use this option, not the default string-only behavior.

**Step 2: Run DeepDiveView unit tests**

Run: `npm run test:run -- src/components/__tests__/DeepDiveView.test.tsx 2>&1 | tail -30`

**Expected:** all 7 tests pass.

If `'maps icon strings to SVG components'` fails because too many or too few SVGs, audit the JSX — there should be exactly ONE Lucide icon per card and no other SVGs in the card markup. The motion wrapper does not introduce extra SVGs.

**Step 3: Run DeepDiveView visual tests** (these use real i18n, no mocks)

Run: `npm run test:run -- src/components/__tests__/DeepDiveView.visual.test.tsx 2>&1 | tail -30`

**Expected:** all 3 tests pass:
- DE renders with `<h2>` present
- EN renders with `<h2>` present
- 3 sections + at least one `.bg-white` card

If a section has zero cards in the real i18n, the DOM still has `<h2>` but no `.bg-white` cards. The visual test expects `cards.length > 0` total across all 3 sections — if real i18n has all-empty card arrays for a language, **STOP and add at least one card to one section** in that locale's `translation.json`. The test is right; the data must exist.

**Step 4: Run a11y DeepDiveView tests**

Run: `npm run test:run -- src/components/__tests__/Guidance.a11y.test.tsx -t "DeepDiveView" 2>&1 | tail -30`

**Expected:** all 5 DeepDiveView a11y tests + the "DeepDiveView cards have visible text" contrast test pass.

**Step 5: Commit**

```bash
git add src/components/DeepDiveView.tsx
git commit -m "$(cat <<'EOF'
feat(guidance): rewrite DeepDiveView to render 3-phase i18n cards

Replaces the generic-tips renderer with the spec'd 3-section card
layout. Reads guidance.deepDive.{beforeSession,duringListening,emergency}
via t(key, { returnObjects: true }), maps icon strings to Lucide
components, uses h2 for section titles and h3 for card titles
(WCAG heading hierarchy). Card uses bg-white.

Resolves DeepDiveView.test.tsx (7), DeepDiveView.visual.test.tsx (3),
DeepDiveView slice of Guidance.a11y.test.tsx (5+1).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Rewrite GuidancePanel

Reference spec: a11y test `Guidance.a11y.test.tsx` lines 181-260, 280-293, 323-337; integration test `SessionView.test.tsx` lines 128, 190, 203, 249.

### Task 9: Plan GuidancePanel contract

**Files:** none (read-only)

**Step 1: Re-read the relevant tests** to extract the contract:
- Named export: `import { GuidancePanel } from '../GuidancePanel'` (Guidance.a11y line 5)
- Props: `{ settings: GuidanceSettings, onSettingsChange: (s) => void, currentPhaseTips: string[] }`
- Outer container has classes `fixed bottom-0 left-0 right-0` plus `h-[360px]` (SessionView test line 215)
- Outer container is `container.firstChild as HTMLElement` and has `fixed`, `bottom-0` (a11y line 245)
- Two mode toggle buttons: `aria-label="Quick Tips"` and `aria-label="Deep Dive"`
- Both are `<button>` elements (a11y test asserts `tagName === 'BUTTON'`)
- The active-mode button has class `bg-indigo-600` (a11y line 230)
- The two buttons have **different className strings** (a11y line 336: `expect(activeButton.className).not.toBe(inactiveButton.className)`)
- Has a scrollable area with class `overflow-y-auto` (a11y line 258)
- Renders `QuickTipsView` if `settings.guidanceMode === 'quick'`, else `DeepDiveView`
- Both modes pass through `currentPhaseTips` to the sub-view
- Mode-toggle click → `onSettingsChange({ ...settings, guidanceMode: <new> })`
- Keyboard-focusable (a11y line 280-293)

**Step 2: Note that the i18n test mock** (Guidance.a11y line 38-39) returns:
- `t('guidancePanel.quickTips')` → `'Quick Tips'`
- `t('guidancePanel.deepDive')` → `'Deep Dive'`

So we use `t('guidancePanel.quickTips', 'Quick Tips')` etc., with both label and aria-label being the same i18n value.

**Step 3: No commit.**

---

### Task 10: Rewrite `GuidancePanel.tsx`

**Files:**
- Modify: `src/components/GuidancePanel.tsx` (full rewrite)

**Step 1: Replace file content**

```tsx
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import type { GuidanceSettings } from '../domain/GuidanceSettings'
import { QuickTipsView } from './QuickTipsView'
import { DeepDiveView } from './DeepDiveView'

export interface GuidancePanelProps {
  settings: GuidanceSettings
  onSettingsChange: (settings: GuidanceSettings) => void
  currentPhaseTips: string[]
}

export function GuidancePanel({
  settings,
  onSettingsChange,
  currentPhaseTips,
}: GuidancePanelProps) {
  const { t } = useTranslation()
  const mode = settings.guidanceMode

  const setMode = (newMode: 'quick' | 'deep-dive') => {
    if (newMode === mode) return
    onSettingsChange({ ...settings, guidanceMode: newMode })
  }

  const quickLabel = t('guidancePanel.quickTips', 'Quick Tips')
  const deepLabel = t('guidancePanel.deepDive', 'Deep Dive')

  const baseBtn =
    'px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const activeBtn = 'bg-indigo-600 text-white'
  const inactiveBtn =
    'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[360px] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10 flex flex-col">
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setMode('quick')}
          aria-label={quickLabel}
          className={`${baseBtn} ${mode === 'quick' ? activeBtn : inactiveBtn}`}
        >
          {quickLabel}
        </button>
        <button
          type="button"
          onClick={() => setMode('deep-dive')}
          aria-label={deepLabel}
          className={`${baseBtn} ${mode === 'deep-dive' ? activeBtn : inactiveBtn}`}
        >
          {deepLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {mode === 'quick' ? (
            <motion.div
              key="quick"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuickTipsView
                tips={currentPhaseTips}
                autoRotate={settings.autoRotation}
                interval={settings.autoRotateInterval}
                shuffleMode={false}
              />
            </motion.div>
          ) : (
            <motion.div
              key="deep-dive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DeepDiveView tips={currentPhaseTips} showAllTips={settings.showAllTips} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Backward-compat default export so SessionView's existing `import GuidancePanel from './GuidancePanel'` keeps working
export default GuidancePanel
```

**Critical notes:**
1. **Named export AND default export.** Tests import named (`{ GuidancePanel }`); SessionView currently imports default. Both work this way until SessionView is updated in Phase 4.
2. **Outer div is `container.firstChild`** in the a11y test — must have `fixed bottom-0 left-0 right-0 h-[360px]` directly. Don't wrap in a fragment or motion.div.
3. **Active button must have `bg-indigo-600`** — that exact class, not a semantic substitute like `bg-primary`. Test uses `toHaveClass('bg-indigo-600')`.
4. **Active vs inactive buttons must have different className strings** — they will because of the active vs inactive class concatenation.
5. **`overflow-y-auto`** on the scrollable body div — a11y test uses `container.querySelector('.overflow-y-auto')`.
6. **Both labels use the same string** for content and aria-label. Tests use `getByLabelText('Quick Tips')` to find the active button by aria-label.

**Step 2: Run GuidancePanel a11y tests**

Run: `npm run test:run -- src/components/__tests__/Guidance.a11y.test.tsx -t "GuidancePanel" 2>&1 | tail -30`

**Expected:** all 5 GuidancePanel a11y tests + GuidancePanel keyboard nav + GuidancePanel contrast pass.

**Step 3: Run SessionView integration tests**

Run: `npm run test:run -- src/components/__tests__/SessionView.test.tsx 2>&1 | tail -40`

**Expected:** the 4 active tests pass:
- 'shows guidance panel when session is running'
- 'adds bottom padding to main content...'
- 'positions guidance panel fixed at bottom'
- 'integrates tips from session context into GuidancePanel'

The 5 `.skip`'d tests stay skipped — we un-skip the persistence/mode-toggle ones in Phase 4 after wiring `onSettingsChange`.

**Step 4: Full a11y suite check**

Run: `npm run test:run -- src/components/__tests__/Guidance.a11y.test.tsx 2>&1 | tail -10`

**Expected:** all 17+ a11y tests pass.

**Step 5: Commit**

```bash
git add src/components/GuidancePanel.tsx
git commit -m "$(cat <<'EOF'
feat(guidance): rewrite GuidancePanel with Quick/Deep mode toggle

Replaces the old auto-rotate-checkbox panel with the spec'd two-mode
panel: header with Quick Tips / Deep Dive toggle buttons, scrollable
body that swaps between QuickTipsView and DeepDiveView based on
settings.guidanceMode. Fixed bottom 360px height, named + default
exports, aria-labels on toggles, active state via bg-indigo-600.

Resolves GuidancePanel slice of Guidance.a11y.test.tsx (8 tests) and
the 4 active SessionView.test.tsx integration tests. Eliminates the
runtime crash that hit on session start (guidanceTexts.length on
undefined).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Wire SessionView to persist mode changes

### Task 11: Wire `onSettingsChange` in `SessionView.tsx`

**Files:**
- Modify: `src/components/SessionView.tsx` (around the `<GuidancePanel ... />` call site at line 199-202 and the surrounding state setup at line 145-153)

**Step 1: Read current `ActiveSessionView` (lines 140-205)**

Already done in Phase 1; the existing local-state-only logic is at:
```tsx
const [guidanceSettings, setGuidanceSettings] = useState<GuidanceSettings>(
  DEFAULT_GUIDANCE_SETTINGS
)
useEffect(() => {
  const settings = PersistenceService.loadGuidanceSettings()
  setGuidanceSettings(settings)
}, [])
```

And the `<GuidancePanel ... />` call:
```tsx
<GuidancePanel
  settings={guidanceSettings}
  currentPhaseTips={currentPhaseTips}
/>
```

**Step 2: Update import**

The current line is `import GuidancePanel from './GuidancePanel'` (default import). Change to named:
```tsx
import { GuidancePanel } from './GuidancePanel'
```

This keeps the runtime behavior identical (we still export both) but is consistent with the test imports.

**Step 3: Add `handleSettingsChange` and pass it as `onSettingsChange`**

Replace the `<GuidancePanel>` call with:
```tsx
<GuidancePanel
  settings={guidanceSettings}
  currentPhaseTips={currentPhaseTips}
  onSettingsChange={(updated) => {
    setGuidanceSettings(updated)
    PersistenceService.saveGuidanceSettings(updated)
  }}
/>
```

**Step 4: Verify `tsc` is clean now**

Run: `npm run typecheck 2>&1 | tail -20`

**Expected:** zero errors. The Phase-2 canary errors are resolved.

If errors persist, read them carefully — the most likely culprit is a stale `GuidanceSettings` field that's no longer required, or a typo in prop name.

**Step 5: Run full test suite**

Run: `npm run test:run 2>&1 | tail -10`

**Expected:** zero failures across all 5 previously-failing test files. `Test Files: 37 passed`. `Tests: ~460 passed | 6 skipped`.

The `.skip`'d tests in `SessionView.test.tsx` related to mode-toggle persistence (lines 141, 171, 220, 265) **stay skipped** for now — they exercise paths beyond the wiring (drag-and-drop, full lifecycle) that aren't in scope of this plan.

**Step 6: Commit**

```bash
git add src/components/SessionView.tsx
git commit -m "$(cat <<'EOF'
feat(guidance): wire SessionView onSettingsChange to PersistenceService

Switches GuidancePanel import to named (matching test imports), adds
handleSettingsChange that updates local state AND persists via
PersistenceService.saveGuidanceSettings. Mode selection now survives
page reload.

All 5 previously-failing test files now pass. tsc --noEmit clean.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Final verification

### Task 12: Lint + format pass

**Files:** any touched in Phases 0-4.

**Step 1: Lint**

Run: `npm run lint 2>&1 | tail -20`

**Expected:** no errors. Warnings are tolerable but should be reviewed.

**Step 2: Format**

Run: `npm run format`

**Step 3: Re-run tests after formatting**

Run: `npm run test:run 2>&1 | tail -5`

**Expected:** still all green.

**Step 4: If format made changes, commit**

```bash
git status
# if there are unstaged changes:
git add -u
git commit -m "$(cat <<'EOF'
style: prettier format guidance redesign files

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Browser smoke test (real working code, real data)

**Why:** Per project-memory rule "demo means real working code, never simulated", we verify in a real browser, not just Vitest. Vitest mocks `framer-motion` and `useTranslation` — the real app uses neither mock.

**Files:** none (interactive)

**Step 1: Build**

Run: `npm run build 2>&1 | tail -10`

**Expected:** Vite output ending with `✓ built in <time>`. No errors.

**Step 2: Start dev server**

Run: `npm run dev`

Note the URL printed (typically `http://localhost:5173`).

**Step 3: Manual verification checklist** (in browser)

Open the printed URL. Then:

1. ✅ App loads without console errors. (Open DevTools console.)
2. ✅ Mode-selection screen visible (Maintain / Commitment / Listening).
3. ✅ Pick **Commitment**, click **Start Session**.
4. ✅ Active session view appears: timer ticks, phase indicator visible.
5. ✅ **GuidancePanel is fixed at the bottom of the viewport, ~360 px tall, with two buttons in the header: "Quick Tips" / "Deep Dive"** (or German equivalents if locale is DE: "Schnelltipps" / "Vertiefung").
6. ✅ Quick Tips mode (default): a tip text is shown with previous / next chevrons and a `1 / N` indicator.
7. ✅ Click **Deep Dive**. The body switches to a 3-section card layout. Each section has a title (`<h2>`) and one or more cards. Each card has a Lucide icon, a bold title, and content text.
8. ✅ Scroll the panel body — the `overflow-y-auto` scroll works.
9. ✅ Click **Quick Tips** again. Mode switches back. Active button is `bg-indigo-600` (visible as solid indigo background).
10. ✅ **Reload the browser tab.** Active session is gone (session state isn't persisted, that's by design), but **return to the mode-selector → start a new session → GuidancePanel opens in the last-used mode** (Quick Tips or Deep Dive). This validates `PersistenceService.saveGuidanceSettings` wiring.
11. ✅ Switch language via the language switcher (DE ↔ EN). All Quick/Deep button labels and Deep Dive section/card content update.
12. ✅ No `Cannot read properties of undefined` errors anywhere in DevTools console during a full session.

**Step 4: If any item fails, document the failure clearly, STOP, and return to debug.** Don't ship a half-passing browser check.

**Step 5: Stop dev server** (Ctrl-C).

**Step 6: No commit** unless smoke-test revealed a fix needed (in which case commit the fix with a descriptive message).

---

### Task 14: Summary commit + status

**Files:** none (read-only verification)

**Step 1: Verify everything**

Run all in sequence:
```bash
npm run typecheck && \
npm run lint && \
npm run test:run && \
npm run build
```

**Expected:** all four exit 0. No red.

**Step 2: Show the commit log of this plan**

Run: `git log --oneline $(git merge-base HEAD main 2>/dev/null || echo HEAD~14)..HEAD`

**Expected:** the chronological list of commits from Phases 0-4. Should be roughly:
- chore: add npm run typecheck script
- (chore: add lucide-react — only if Task 3 installed it)
- feat(guidance): rewrite QuickTipsView to test contract
- feat(guidance): add icon-string to Lucide component map
- feat(guidance): rewrite DeepDiveView to render 3-phase i18n cards
- feat(guidance): rewrite GuidancePanel with Quick/Deep mode toggle
- feat(guidance): wire SessionView onSettingsChange to PersistenceService
- (style: prettier format — only if Task 12 had changes)

**Step 3: No further commit.** The plan is complete when this verification is clean.

---

## Out of scope (intentional)

- Un-skipping the 5 `.skip`'d tests in `SessionView.test.tsx` that test full mode-toggle persistence flows. These exercise paths beyond simple wiring (e.g. fireEvent.click chains through nested context). They're documented as a separate follow-up — file an issue if you want them in a future plan.
- Adding new Lucide icons not currently referenced in `guidance.deepDive.*` i18n. If the existing keys reference an icon not in our map, **add it to the map**, but don't preemptively add icons.
- Wiring up Web Push notifications, mode-specific summary prompts, recording, or any other VibeMind-MVP features. Those are tracked separately under `docs/specs/`.
- Changing `useTipRotation`. It already works correctly; tests mock it.
- CI integration of `npm run typecheck`. Add to `.github/workflows/` separately when we set up CI in earnest — the script existing locally is sufficient for now.

## Done criteria

- All 5 previously-failing test files green.
- `npm run typecheck` clean.
- `npm run lint` clean.
- `npm run build` succeeds.
- Browser smoke test passes all 12 items.
- No `.skip` tests added to existing files (existing skips stay).
- Commit log tells a coherent story of the redesign completion.

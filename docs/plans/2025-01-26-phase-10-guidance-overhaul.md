# Phase 10: Guidance & Tooltip Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Replace small tip display with large bottom guidance panel featuring two-tier content (Quick Tips + Deep Dive) and comprehensive conversation guidance.

**Architecture:** Create new `GuidancePanel` component (360px bottom-fixed) with two modes: Quick Tips (shuffle-enabled simple tips) and Deep Dive (detailed multi-card guidance from reference images). Add `useTipRotation` hook for shuffle logic, extend i18n with array-based card structure, and integrate guidance settings into persistence layer.

**Tech Stack:** React 19, TypeScript 5, Framer Motion (animations), i18n (localization), Tailwind CSS (styling), Lucide React (icons)

---

## Task 1: Create GuidanceSettings Domain Type

**Files:**
- Create: `src/domain/GuidanceSettings.ts`
- Test: `src/domain/__tests__/GuidanceSettings.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import {
  GuidanceSettings,
  DEFAULT_GUIDANCE_SETTINGS,
  createGuidanceSettings,
} from '../GuidanceSettings'

describe('GuidanceSettings', () => {
  it('should create default guidance settings', () => {
    const settings = createGuidanceSettings()
    expect(settings.showAllTips).toBe(false)
    expect(settings.guidanceMode).toBe('quick')
    expect(settings.enableInMaintain).toBe(false)
    expect(settings.autoRotateInterval).toBe(20)
  })

  it('should merge partial settings with defaults', () => {
    const settings = createGuidanceSettings({ showAllTips: true })
    expect(settings.showAllTips).toBe(true)
    expect(settings.guidanceMode).toBe('quick') // still default
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/domain/__tests__/GuidanceSettings.test.ts`
Expected: FAIL with "Cannot find module '../GuidanceSettings'"

**Step 3: Write minimal implementation**

```typescript
/**
 * Guidance display mode
 */
export type GuidanceMode = 'quick' | 'deep-dive'

/**
 * Settings for guidance panel behavior
 */
export interface GuidanceSettings {
  /** Show all tips in shuffled rotation */
  showAllTips: boolean

  /** Current guidance mode */
  guidanceMode: GuidanceMode

  /** Enable guidance in Maintain mode */
  enableInMaintain: boolean

  /** Auto-rotation interval in seconds */
  autoRotateInterval: number
}

/**
 * Default guidance settings
 */
export const DEFAULT_GUIDANCE_SETTINGS: GuidanceSettings = {
  showAllTips: false,
  guidanceMode: 'quick',
  enableInMaintain: false,
  autoRotateInterval: 20,
}

/**
 * Create guidance settings with optional overrides
 */
export function createGuidanceSettings(
  partial?: Partial<GuidanceSettings>
): GuidanceSettings {
  return { ...DEFAULT_GUIDANCE_SETTINGS, ...partial }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/domain/__tests__/GuidanceSettings.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/phase-10-guidance
git add src/domain/GuidanceSettings.ts src/domain/__tests__/GuidanceSettings.test.ts
git commit -m "feat(domain): add GuidanceSettings type and defaults"
```

---

## Task 2: Add Guidance Settings to PersistenceService

**Files:**
- Modify: `src/services/PersistenceService.ts`
- Modify: `src/services/__tests__/PersistenceService.test.ts`

**Step 1: Write the failing test**

Add to `src/services/__tests__/PersistenceService.test.ts`:

```typescript
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS } from '../../domain/GuidanceSettings'

describe('PersistenceService - Guidance Settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should load default guidance settings when none stored', () => {
    const settings = PersistenceService.loadGuidanceSettings()
    expect(settings).toEqual(DEFAULT_GUIDANCE_SETTINGS)
  })

  it('should save and load guidance settings', () => {
    const customSettings: GuidanceSettings = {
      showAllTips: true,
      guidanceMode: 'deep-dive',
      enableInMaintain: true,
      autoRotateInterval: 30,
    }
    PersistenceService.saveGuidanceSettings(customSettings)
    const loaded = PersistenceService.loadGuidanceSettings()
    expect(loaded).toEqual(customSettings)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/services/__tests__/PersistenceService.test.ts`
Expected: FAIL with "Property 'loadGuidanceSettings' does not exist"

**Step 3: Add implementation to PersistenceService**

```typescript
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS } from '../domain/GuidanceSettings'

// Add to PersistenceServiceProtocol interface
export interface PersistenceServiceProtocol {
  // ... existing methods
  loadGuidanceSettings(): GuidanceSettings
  saveGuidanceSettings(settings: GuidanceSettings): void
}

// Add to PersistenceServiceImpl class
class PersistenceServiceImpl implements PersistenceServiceProtocol {
  // ... existing methods

  loadGuidanceSettings(): GuidanceSettings {
    const stored = localStorage.getItem('guidanceSettings')
    if (!stored) return DEFAULT_GUIDANCE_SETTINGS

    try {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_GUIDANCE_SETTINGS, ...parsed }
    } catch {
      return DEFAULT_GUIDANCE_SETTINGS
    }
  }

  saveGuidanceSettings(settings: GuidanceSettings): void {
    localStorage.setItem('guidanceSettings', JSON.stringify(settings))
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/services/__tests__/PersistenceService.test.ts`
Expected: PASS (all tests including new ones)

**Step 5: Commit**

```bash
git add src/services/PersistenceService.ts src/services/__tests__/PersistenceService.test.ts
git commit -m "feat(services): add guidance settings persistence"
```

---

## Task 3: Create useTipRotation Hook

**Files:**
- Create: `src/hooks/useTipRotation.ts`
- Create: `src/hooks/__tests__/useTipRotation.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTipRotation } from '../useTipRotation'

describe('useTipRotation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const tips = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5']

  it('should start at index 0', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.current).toBe('tip1')
  })

  it('should advance to next tip on manual next', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    act(() => result.current.next())
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.current).toBe('tip2')
  })

  it('should go back to previous tip', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    act(() => result.current.next())
    act(() => result.current.previous())
    expect(result.current.currentIndex).toBe(0)
  })

  it('should wrap around at end', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    // Go to end
    for (let i = 0; i < 4; i++) act(() => result.current.next())
    expect(result.current.currentIndex).toBe(4)
    // Should wrap to 0
    act(() => result.current.next())
    expect(result.current.currentIndex).toBe(0)
  })

  it('should shuffle indices when shuffleMode is true', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: true })
    )
    // Should have shuffled indices
    const seenTips = new Set()
    for (let i = 0; i < 5; i++) {
      seenTips.add(result.current.current)
      act(() => result.current.next())
    }
    // All tips should appear exactly once
    expect(seenTips.size).toBe(5)
  })

  it('should auto-rotate when enabled', async () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: true, interval: 2, shuffleMode: false })
    )
    expect(result.current.currentIndex).toBe(0)

    act(() => vi.advanceTimersByTime(2000))
    await waitFor(() => expect(result.current.currentIndex).toBe(1))

    act(() => vi.advanceTimersByTime(2000))
    await waitFor(() => expect(result.current.currentIndex).toBe(2))
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/hooks/__tests__/useTipRotation.test.ts`
Expected: FAIL with "Cannot find module '../useTipRotation'"

**Step 3: Write implementation**

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export interface TipRotationConfig {
  /** Array of tips */
  tips: string[]
  /** Enable auto-rotation */
  autoRotate: boolean
  /** Seconds between rotations */
  interval: number
  /** Use shuffle mode (show each once before repeat) */
  shuffleMode: boolean
}

export interface TipRotationState {
  /** Current tip */
  current: string
  /** Current index in original array */
  currentIndex: number
  /** Total number of tips */
  total: number
  /** Advance to next tip */
  next: () => void
  /** Go to previous tip */
  previous: () => void
  /** Go to specific index */
  goTo: (index: number) => void
}

export function useTipRotation(config: TipRotationConfig): TipRotationState {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([])

  // Initialize shuffled indices
  useEffect(() => {
    if (config.shuffleMode && config.tips.length > 0) {
      const indices = Array.from({ length: config.tips.length }, (_, i) => i)
      setShuffledIndices(shuffleArray(indices))
      setCurrentIndex(0)
    }
  }, [config.tips.length, config.shuffleMode])

  // Auto-rotation timer
  useEffect(() => {
    if (!config.autoRotate || config.tips.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIdx = (prev + 1) % config.tips.length
        // Reshuffle when deck is exhausted
        if (nextIdx === 0 && config.shuffleMode) {
          setTimeout(() => {
            const indices = Array.from({ length: config.tips.length }, (_, i) => i)
            setShuffledIndices(shuffleArray(indices))
          }, 100)
        }
        return nextIdx
      })
    }, config.interval * 1000)

    return () => clearInterval(timer)
  }, [config.autoRotate, config.interval, config.tips.length, config.shuffleMode])

  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIdx = (prev + 1) % config.tips.length
      if (nextIdx === 0 && config.shuffleMode) {
        const indices = Array.from({ length: config.tips.length }, (_, i) => i)
        setShuffledIndices(shuffleArray(indices))
      }
      return nextIdx
    })
  }, [config.tips.length, config.shuffleMode])

  const previous = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + config.tips.length) % config.tips.length)
  }, [config.tips.length])

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < config.tips.length) {
        setCurrentIndex(index)
      }
    },
    [config.tips.length]
  )

  const current = useMemo(() => {
    if (config.tips.length === 0) return ''
    const actualIndex = config.shuffleMode ? shuffledIndices[currentIndex] ?? currentIndex : currentIndex
    return config.tips[actualIndex] ?? ''
  }, [config.tips, config.shuffleMode, shuffledIndices, currentIndex])

  return {
    current,
    currentIndex,
    total: config.tips.length,
    next,
    previous,
    goTo,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/hooks/__tests__/useTipRotation.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/hooks/useTipRotation.ts src/hooks/__tests__/useTipRotation.test.ts
git commit -m "feat(hooks): add useTipRotation with shuffle support"
```

---

## Task 4: Extend i18n with Array-Based Guidance Content

**Files:**
- Modify: `src/i18n/locales/en/translation.json`
- Modify: `src/i18n/locales/de/translation.json`
- Create: `src/i18n/__tests__/i18n.parity.test.ts`

**Step 1: Update English translations**

Modify `src/i18n/locales/en/translation.json`:

```json
{
  "app": { /* existing */ },
  "modes": { /* existing */ },
  "phases": { /* existing */ },
  "speaker": { /* existing */ },
  "session": { /* existing */ },
  "controls": { /* existing */ },
  "guidance": {
    "quick": {
      "prep": [
        "Take a moment to arrive and settle in.",
        "Take a few deep breaths together.",
        "Put away electronic devices.",
        "Create an undisturbed space.",
        "Open yourself to what may come."
      ],
      "transition": [
        "Take time to process what you heard.",
        "What touched you the most?",
        "Stay present and attentive.",
        "Prepare for the next exchange.",
        "Feel the connection between you."
      ],
      "cooldown": [
        "Let the conversation resonate.",
        "Avoid further discussion now.",
        "Enjoy the shared silence.",
        "Honor the exchange that took place.",
        "Stay connected, even without words."
      ]
    },
    "deepDive": {
      "beforeSession": {
        "title": "Phase 1: Preparation",
        "cards": [
          {
            "title": "Schedule Agreement",
            "content": "Set a fixed weekly time (e.g., 90 min) and a start time.",
            "icon": "calendar"
          },
          {
            "title": "Create Disturbance-Free Space",
            "content": "Ensure a quiet environment without distractions or visitors.",
            "icon": "door-closed"
          },
          {
            "title": "Establish Clear Rules",
            "content": "Agree on a fixed speaking time (e.g., 15 min) and strict listening protocol.",
            "icon": "clipboard-check"
          },
          {
            "title": "Ritual Foundation",
            "content": "Make the session a fixed, non-negotiable ritual that isn't skipped.",
            "icon": "handshake"
          }
        ]
      },
      "duringListening": {
        "title": "Phase 2: During Listening",
        "cards": [
          {
            "title": "Radical Empathy",
            "content": "Your only task is to listen with full attention, without your own agenda.",
            "icon": "heart"
          },
          {
            "title": "Strict Taboos",
            "content": "Absolute prohibition: No interrupting, judging, advising, or non-verbal rejection (e.g., eye-rolling).",
            "icon": "ban"
          },
          {
            "title": "Embrace Silence",
            "content": "When your partner pauses to think, remain still even if the silence feels long.",
            "icon": "volume-x"
          },
          {
            "title": "Speaker/Listener Roles",
            "content": "The speaker says 'I think/feel...', the listener only listens attentively without judgment.",
            "icon": "users"
          }
        ]
      },
      "emergency": {
        "title": "Phase 3: Emergency Situations",
        "cards": [
          {
            "title": "Call Time-Out",
            "content": "Stop the conversation as soon as you or your partner feel emotionally overwhelmed.",
            "icon": "clock"
          },
          {
            "title": "Calm Down Physically",
            "content": "Use the pause for calming activities (e.g., reading, walking), not to brood.",
            "icon": "activity"
          },
          {
            "title": "Resume Conversation",
            "content": "Resume the dialogue within 24 hours to avoid the conflict from escalating.",
            "icon": "play-circle"
          }
        ]
      },
      "coreRules": {
        "title": "Core Conversation Principles",
        "speaker": {
          "title": "Speaker Guidelines",
          "icon": "mic",
          "rules": [
            "Say 'I think...' or 'I feel...' (first-person)",
            "Avoid accusations",
            "Absolute taboos: No interrupting, judging, advising, dismissive reactions"
          ]
        },
        "listener": {
          "title": "Listener Guidelines",
          "icon": "headphones",
          "rules": [
            "Listen attentively and without judgment",
            "Maintain eye contact",
            "Absolute taboos: No interrupting, commenting, judging, or non-verbal dismissal"
          ]
        }
      }
    }
  },
  "guidancePanel": {
    "title": "Guidance",
    "quickTips": "Quick Tips",
    "deepDive": "Deep Dive",
    "hidePanel": "Hide Panel",
    "showPanel": "Show Guidance",
    "autoRotate": "Auto-rotate tips",
    "previousTip": "Previous tip",
    "nextTip": "Next tip"
  },
  "tips": { /* existing */ },
  "common": { /* existing */ },
  "builder": { /* existing */ },
  "guidanceLevel": { /* existing */ },
  "settings": { /* existing */ }
}
```

**Step 2: Update German translations**

Modify `src/i18n/locales/de/translation.json` with matching structure:

```json
{
  "guidance": {
    "quick": {
      "prep": [
        "Nimm dir einen Moment, um anzukommen und dich zu sammeln.",
        "Atmet gemeinsam ein paar Mal tief ein.",
        "Legt elektronische Geräte weg.",
        "Schafft einen ungestörten Raum.",
        "Öffne dich für das, was kommen mag."
      ],
      "transition": [ /* 5 German tips */ ],
      "cooldown": [ /* 5 German tips */ ]
    },
    "deepDive": {
      "beforeSession": {
        "title": "Phase 1: Vorbereitung",
        "cards": [
          {
            "title": "Terminvereinbarung",
            "content": "Legt einen festen wöchentlichen Termin fest (z.B. 90 Min.) und eine Startzeit.",
            "icon": "calendar"
          }
          /* ... rest of cards translated */
        ]
      }
      /* ... rest of sections */
    }
  },
  "guidancePanel": {
    "title": "Anleitung",
    "quickTips": "Schnelltipps",
    "deepDive": "Vertiefung",
    "hidePanel": "Panel ausblenden",
    "showPanel": "Anleitung anzeigen",
    "autoRotate": "Tipps automatisch wechseln",
    "previousTip": "Vorheriger Tipp",
    "nextTip": "Nächster Tipp"
  }
}
```

**Step 3: Write i18n parity test**

```typescript
import { describe, it, expect } from 'vitest'
import en from '../locales/en/translation.json'
import de from '../locales/de/translation.json'

function getKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).flatMap((key) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      return getKeys(obj[key], path)
    }
    return [path]
  })
}

describe('i18n Parity', () => {
  it('should have matching key structures in EN and DE', () => {
    const enKeys = getKeys(en).sort()
    const deKeys = getKeys(de).sort()
    expect(deKeys).toEqual(enKeys)
  })

  it('should have same array lengths for guidance tips', () => {
    expect(de.guidance.quick.prep).toHaveLength(en.guidance.quick.prep.length)
    expect(de.guidance.quick.transition).toHaveLength(en.guidance.quick.transition.length)
    expect(de.guidance.quick.cooldown).toHaveLength(en.guidance.quick.cooldown.length)
  })

  it('should have same number of deep dive cards', () => {
    expect(de.guidance.deepDive.beforeSession.cards).toHaveLength(
      en.guidance.deepDive.beforeSession.cards.length
    )
    expect(de.guidance.deepDive.duringListening.cards).toHaveLength(
      en.guidance.deepDive.duringListening.cards.length
    )
    expect(de.guidance.deepDive.emergency.cards).toHaveLength(
      en.guidance.deepDive.emergency.cards.length
    )
  })
})
```

**Step 4: Run test to verify parity**

Run: `npm run test:run src/i18n/__tests__/i18n.parity.test.ts`
Expected: PASS (all locales have matching structures)

**Step 5: Commit**

```bash
git add src/i18n/locales/en/translation.json src/i18n/locales/de/translation.json src/i18n/__tests__/i18n.parity.test.ts
git commit -m "feat(i18n): add array-based guidance content for EN/DE"
```

---

## Task 5: Create QuickTipsView Component

**Files:**
- Create: `src/components/QuickTipsView.tsx`
- Create: `src/components/__tests__/QuickTipsView.test.tsx`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickTipsView } from '../QuickTipsView'

const mockTips = ['Tip 1', 'Tip 2', 'Tip 3']

describe('QuickTipsView', () => {
  it('should render current tip', () => {
    render(<QuickTipsView tips={mockTips} currentTip="Tip 1" currentIndex={0} total={3} onNext={vi.fn()} onPrevious={vi.fn()} />)
    expect(screen.getByText('Tip 1')).toBeInTheDocument()
  })

  it('should call onNext when next button clicked', () => {
    const onNext = vi.fn()
    render(<QuickTipsView tips={mockTips} currentTip="Tip 1" currentIndex={0} total={3} onNext={onNext} onPrevious={vi.fn()} />)

    const nextButton = screen.getByLabelText(/next tip/i)
    fireEvent.click(nextButton)
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('should show position indicators', () => {
    render(<QuickTipsView tips={mockTips} currentTip="Tip 2" currentIndex={1} total={3} onNext={vi.fn()} onPrevious={vi.fn()} />)
    const indicators = screen.getAllByRole('button', { name: /go to tip/i })
    expect(indicators).toHaveLength(3)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/components/__tests__/QuickTipsView.test.tsx`
Expected: FAIL with "Cannot find module '../QuickTipsView'"

**Step 3: Write implementation**

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'

interface QuickTipsViewProps {
  tips: string[]
  currentTip: string
  currentIndex: number
  total: number
  onNext: () => void
  onPrevious: () => void
  onGoTo?: (index: number) => void
}

export function QuickTipsView({
  currentTip,
  currentIndex,
  total,
  onNext,
  onPrevious,
  onGoTo,
}: QuickTipsViewProps) {
  const { t } = useTranslation()

  if (total === 0) return null

  return (
    <div className="flex flex-col h-full">
      {/* Main tip content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="flex items-start gap-6 max-w-3xl w-full">
          <div className="flex-shrink-0 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <Lightbulb className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed"
              >
                {currentTip}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation controls */}
      {total > 1 && (
        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onPrevious}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('guidancePanel.previousTip', 'Previous tip')}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex gap-2">
            {Array.from({ length: total }).map((_, index) => (
              <button
                key={index}
                onClick={() => onGoTo?.(index)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all
                  ${
                    index === currentIndex
                      ? 'w-8 bg-amber-500'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-amber-400'
                  }
                `}
                aria-label={t('tips.goToTip', 'Go to tip {{number}}', { number: index + 1 })}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('guidancePanel.nextTip', 'Next tip')}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/components/__tests__/QuickTipsView.test.tsx`
Expected: PASS (all tests)

**Step 5: Add lucide-react dependency if needed**

Run: `npm install lucide-react`

**Step 6: Commit**

```bash
git add src/components/QuickTipsView.tsx src/components/__tests__/QuickTipsView.test.tsx
git commit -m "feat(components): add QuickTipsView with navigation"
```

---

## Task 6: Create DeepDiveView Component

**Files:**
- Create: `src/components/DeepDiveView.tsx`
- Create: `src/components/__tests__/DeepDiveView.test.tsx`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import { DeepDiveView } from '../DeepDiveView'

describe('DeepDiveView', () => {
  const renderWithi18n = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>)
  }

  it('should render all deep dive sections', () => {
    renderWithi18n(<DeepDiveView />)
    expect(screen.getByText(/Phase 1: Preparation/i)).toBeInTheDocument()
    expect(screen.getByText(/Phase 2: During Listening/i)).toBeInTheDocument()
    expect(screen.getByText(/Phase 3: Emergency/i)).toBeInTheDocument()
    expect(screen.getByText(/Core.*Principles/i)).toBeInTheDocument()
  })

  it('should render all cards from beforeSession section', () => {
    renderWithi18n(<DeepDiveView />)
    expect(screen.getByText(/Schedule Agreement/i)).toBeInTheDocument()
    expect(screen.getByText(/Disturbance-Free Space/i)).toBeInTheDocument()
    expect(screen.getByText(/Clear Rules/i)).toBeInTheDocument()
    expect(screen.getByText(/Ritual Foundation/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/components/__tests__/DeepDiveView.test.tsx`
Expected: FAIL with "Cannot find module '../DeepDiveView'"

**Step 3: Write implementation**

```typescript
import { useTranslation } from 'react-i18next'
import * as Icons from 'lucide-react'

interface Card {
  title: string
  content: string
  icon: string
}

interface Section {
  title: string
  cards: Card[]
}

function IconComponent({ name }: { name: string }) {
  const Icon = (Icons as any)[toPascalCase(name)] || Icons.Lightbulb
  return <Icon className="w-6 h-6" />
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

export function DeepDiveView() {
  const { t } = useTranslation()

  const sections = [
    {
      key: 'beforeSession',
      data: t('guidance.deepDive.beforeSession', { returnObjects: true }) as Section,
    },
    {
      key: 'duringListening',
      data: t('guidance.deepDive.duringListening', { returnObjects: true }) as Section,
    },
    {
      key: 'emergency',
      data: t('guidance.deepDive.emergency', { returnObjects: true }) as Section,
    },
  ]

  const coreRules = t('guidance.deepDive.coreRules', { returnObjects: true }) as any

  return (
    <div className="space-y-8 pb-6">
      {sections.map((section) => (
        <div key={section.key}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {section.data.title}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {section.data.cards.map((card, idx) => (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <IconComponent name={card.icon} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                      {card.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{card.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Core Rules Section */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {coreRules.title}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Speaker */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <IconComponent name={coreRules.speaker.icon} />
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                {coreRules.speaker.title}
              </h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {coreRules.speaker.rules.map((rule: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Listener */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-3">
              <IconComponent name={coreRules.listener.icon} />
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                {coreRules.listener.title}
              </h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {coreRules.listener.rules.map((rule: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/components/__tests__/DeepDiveView.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/components/DeepDiveView.tsx src/components/__tests__/DeepDiveView.test.tsx
git commit -m "feat(components): add DeepDiveView with multi-card layout"
```

---

## Task 7: Create GuidancePanel Main Component

**Files:**
- Create: `src/components/GuidancePanel.tsx`
- Create: `src/components/__tests__/GuidancePanel.test.tsx`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import { GuidancePanel } from '../GuidancePanel'
import { PhaseType } from '../../domain/PhaseType'
import { GuidanceLevel } from '../../domain/GuidanceLevel'

describe('GuidancePanel', () => {
  const renderWithi18n = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>)
  }

  it('should render in Quick Tips mode by default', () => {
    renderWithi18n(
      <GuidancePanel
        phaseType={PhaseType.Prep}
        guidanceLevel={GuidanceLevel.High}
        isVisible={true}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/Quick Tips/i)).toBeInTheDocument()
  })

  it('should toggle to Deep Dive mode', () => {
    renderWithi18n(
      <GuidancePanel
        phaseType={PhaseType.Prep}
        guidanceLevel={GuidanceLevel.High}
        isVisible={true}
        onClose={vi.fn()}
      />
    )
    const deepDiveButton = screen.getByText(/Deep Dive/i)
    fireEvent.click(deepDiveButton)
    expect(screen.getByText(/Phase 1: Preparation/i)).toBeInTheDocument()
  })

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn()
    renderWithi18n(
      <GuidancePanel
        phaseType={PhaseType.Prep}
        guidanceLevel={GuidanceLevel.High}
        isVisible={true}
        onClose={onClose}
      />
    )
    const closeButton = screen.getByLabelText(/hide panel/i)
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should not render when isVisible is false', () => {
    renderWithi18n(
      <GuidancePanel
        phaseType={PhaseType.Prep}
        guidanceLevel={GuidanceLevel.High}
        isVisible={false}
        onClose={vi.fn()}
      />
    )
    expect(screen.queryByText(/Guidance/i)).not.toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run src/components/__tests__/GuidancePanel.test.tsx`
Expected: FAIL with "Cannot find module '../GuidancePanel'"

**Step 3: Write implementation**

```typescript
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { PhaseType } from '../domain/PhaseType'
import { GuidanceLevel } from '../domain/GuidanceLevel'
import { GuidanceMode } from '../domain/GuidanceSettings'
import { getTipCategoryForPhase, shouldShowTips } from '../services/GuidanceService'
import { useTipRotation } from '../hooks/useTipRotation'
import { QuickTipsView } from './QuickTipsView'
import { DeepDiveView } from './DeepDiveView'

interface GuidancePanelProps {
  phaseType: PhaseType
  guidanceLevel: GuidanceLevel
  isVisible: boolean
  onClose: () => void
  mode?: GuidanceMode
  showAllTips?: boolean
  autoRotateInterval?: number
}

export function GuidancePanel({
  phaseType,
  guidanceLevel,
  isVisible,
  onClose,
  mode: initialMode = 'quick',
  showAllTips = false,
  autoRotateInterval = 20,
}: GuidancePanelProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<GuidanceMode>(initialMode)

  // Get tips for current phase
  const tips = useMemo(() => {
    if (!shouldShowTips(phaseType, guidanceLevel)) return []

    const category = getTipCategoryForPhase(phaseType)
    if (!category) return []

    const tipArray = t(`guidance.quick.${category}`, { returnObjects: true }) as string[]
    return Array.isArray(tipArray) ? tipArray : []
  }, [phaseType, guidanceLevel, t])

  // Tip rotation logic
  const rotation = useTipRotation({
    tips,
    autoRotate: mode === 'quick' && tips.length > 1,
    interval: autoRotateInterval,
    shuffleMode: showAllTips,
  })

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl"
        style={{ height: '360px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t('guidancePanel.title', 'Guidance')}
          </h3>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setMode('quick')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  mode === 'quick'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('guidancePanel.quickTips', 'Quick Tips')}
              </button>
              <button
                onClick={() => setMode('deep-dive')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  mode === 'deep-dive'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('guidancePanel.deepDive', 'Deep Dive')}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={t('guidancePanel.hidePanel', 'Hide Panel')}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(360px-64px)] overflow-y-auto">
          {mode === 'quick' ? (
            <QuickTipsView
              tips={tips}
              currentTip={rotation.current}
              currentIndex={rotation.currentIndex}
              total={rotation.total}
              onNext={rotation.next}
              onPrevious={rotation.previous}
              onGoTo={rotation.goTo}
            />
          ) : (
            <div className="px-6 py-4">
              <DeepDiveView />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run src/components/__tests__/GuidancePanel.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/components/GuidancePanel.tsx src/components/__tests__/GuidancePanel.test.tsx
git commit -m "feat(components): add GuidancePanel with mode toggle"
```

---

## Task 8: Integrate GuidancePanel into SessionView

**Files:**
- Modify: `src/components/SessionView.tsx`

**Step 1: Import GuidancePanel and remove TipDisplay**

```typescript
// Remove this import
// import { TipDisplay } from './TipDisplay'

// Add these imports
import { GuidancePanel } from './GuidancePanel'
import { useState } from 'react' // if not already imported
```

**Step 2: Add guidance panel state in ActiveSessionView**

```typescript
function ActiveSessionView() {
  const viewModel = useSessionViewModel()
  const [guidancePanelVisible, setGuidancePanelVisible] = useState(true)

  return (
    <div className="flex flex-col min-h-screen">
      {/* ... existing header */}

      {/* Main content - adjust padding for panel */}
      <main
        className={`flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 ${
          guidancePanelVisible ? 'pb-[380px]' : ''
        }`}
      >
        {/* ... existing content: PhaseIndicator, TimerDisplay, ProgressBar */}

        {/* Remove TipDisplay component */}
      </main>

      {/* ... existing footer */}

      {/* Add GuidancePanel */}
      <GuidancePanel
        phaseType={viewModel.phaseType ?? PhaseType.Prep}
        guidanceLevel={viewModel.mode?.guidanceLevel ?? GuidanceLevel.Minimal}
        isVisible={guidancePanelVisible}
        onClose={() => setGuidancePanelVisible(false)}
      />
    </div>
  )
}
```

**Step 3: Run build and verify**

Run: `npm run build`
Expected: Success

**Step 4: Manual test in dev mode**

Run: `npm run dev`
Navigate to app, verify:
- Guidance panel appears at bottom
- Can toggle between Quick Tips and Deep Dive
- Can close panel
- No visual overlap with main content

**Step 5: Commit**

```bash
git add src/components/SessionView.tsx
git commit -m "feat(ui): integrate GuidancePanel into SessionView"
```

---

## Task 9: Add Guidance Settings to Settings Component

**Files:**
- Modify: `src/components/Settings.tsx`

**Step 1: Add guidance settings section**

Add to Settings component:

```typescript
import { GuidanceSettings } from '../domain/GuidanceSettings'
import { PersistenceService } from '../services/PersistenceService'

// Add state for guidance settings
const [guidanceSettings, setGuidanceSettings] = useState<GuidanceSettings>(() =>
  PersistenceService.loadGuidanceSettings()
)

// Add save handler
const handleGuidanceSettingChange = (updates: Partial<GuidanceSettings>) => {
  const newSettings = { ...guidanceSettings, ...updates }
  setGuidanceSettings(newSettings)
  PersistenceService.saveGuidanceSettings(newSettings)
}

// Add UI section in settings panel
<section className="space-y-4">
  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
    {t('settings.guidance', 'Guidance')}
  </h3>

  {/* Show All Tips Toggle */}
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium text-gray-700 dark:text-gray-200">
        {t('settings.showAllTips', 'Show All Tips')}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('settings.showAllTipsDesc', 'Shuffle and show all tips in each phase')}
      </div>
    </div>
    <input
      type="checkbox"
      checked={guidanceSettings.showAllTips}
      onChange={(e) => handleGuidanceSettingChange({ showAllTips: e.target.checked })}
      className="w-4 h-4"
    />
  </div>

  {/* Enable in Maintain Mode */}
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium text-gray-700 dark:text-gray-200">
        {t('settings.enableInMaintain', 'Enable in Maintain Mode')}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('settings.enableInMaintainDesc', 'Show guidance during Maintain sessions')}
      </div>
    </div>
    <input
      type="checkbox"
      checked={guidanceSettings.enableInMaintain}
      onChange={(e) => handleGuidanceSettingChange({ enableInMaintain: e.target.checked })}
      className="w-4 h-4"
    />
  </div>

  {/* Rotation Interval */}
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium text-gray-700 dark:text-gray-200">
        {t('settings.rotationInterval', 'Rotation Interval')}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {guidanceSettings.autoRotateInterval}s
      </div>
    </div>
    <input
      type="range"
      min="10"
      max="60"
      step="5"
      value={guidanceSettings.autoRotateInterval}
      onChange={(e) => handleGuidanceSettingChange({ autoRotateInterval: parseInt(e.target.value) })}
      className="w-32"
    />
  </div>
</section>
```

**Step 2: Add i18n keys**

Update `src/i18n/locales/en/translation.json`:

```json
{
  "settings": {
    "title": "Settings",
    "darkMode": "Dark Mode",
    "darkModeDesc": "Reduce eye strain in low light",
    "language": "Language",
    "sound": "Sound",
    "soundDesc": "Singing bowl sounds for phase transitions",
    "guidance": "Guidance",
    "showAllTips": "Show All Tips",
    "showAllTipsDesc": "Shuffle and show all tips in each phase",
    "enableInMaintain": "Enable in Maintain Mode",
    "enableInMaintainDesc": "Show guidance during Maintain sessions",
    "rotationInterval": "Rotation Interval"
  }
}
```

**Step 3: Run build and verify**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add src/components/Settings.tsx src/i18n/locales/en/translation.json src/i18n/locales/de/translation.json
git commit -m "feat(settings): add guidance configuration panel"
```

---

## Task 10: Add Accessibility Tests

**Files:**
- Create: `src/components/__tests__/GuidancePanel.a11y.test.tsx`

**Step 1: Write accessibility tests**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import { GuidancePanel } from '../GuidancePanel'
import { PhaseType } from '../../domain/PhaseType'
import { GuidanceLevel } from '../../domain/GuidanceLevel'

expect.extend(toHaveNoViolations)

describe('GuidancePanel Accessibility', () => {
  const renderWithi18n = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>)
  }

  it('should have no accessibility violations', async () => {
    const { container } = renderWithi18n(
      <GuidancePanel
        phaseType={PhaseType.Prep}
        guidanceLevel={GuidanceLevel.High}
        isVisible={true}
        onClose={() => {}}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA labels on navigation buttons', () => {
    renderWithi18n(
      <GuidancePanel
        phaseType={PhaseType.Prep}
        guidanceLevel={GuidanceLevel.High}
        isVisible={true}
        onClose={() => {}}
      />
    )
    expect(screen.getByLabelText(/previous tip/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/next tip/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hide panel/i)).toBeInTheDocument()
  })

  it('should support keyboard navigation', () => {
    renderWithi18n(
      <GuidancePanel
        phaseType={PhaseType.Prep}
        guidanceLevel={GuidanceLevel.High}
        isVisible={true}
        onClose={() => {}}
      />
    )
    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label')
    })
  })
})
```

**Step 2: Install jest-axe**

Run: `npm install --save-dev jest-axe @axe-core/react`

**Step 3: Run test to verify**

Run: `npm run test:run src/components/__tests__/GuidancePanel.a11y.test.tsx`
Expected: PASS (all accessibility tests)

**Step 4: Commit**

```bash
git add src/components/__tests__/GuidancePanel.a11y.test.tsx package.json package-lock.json
git commit -m "test(a11y): add accessibility tests for GuidancePanel"
```

---

## Task 11: Final Integration Test

**Files:**
- Create: `src/__tests__/guidanceIntegration.test.tsx`

**Step 1: Write end-to-end integration test**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from '../contexts/SessionContext'
import { SessionView } from '../components/SessionView'
import { COMMITMENT_MODE } from '../domain/SessionMode.presets'

describe('Guidance Integration', () => {
  it('should show guidance panel during active session', async () => {
    render(
      <SessionProvider>
        <SessionView />
      </SessionProvider>
    )

    // Select Commitment mode
    const commitmentCard = screen.getByText(/Commitment/i)
    fireEvent.click(commitmentCard)

    // Start session
    const startButton = screen.getByText(/Start Session/i)
    fireEvent.click(startButton)

    // Wait for guidance panel to appear
    await waitFor(() => {
      expect(screen.getByText(/Guidance/i)).toBeInTheDocument()
    })

    // Verify Quick Tips mode is default
    expect(screen.getByText(/Quick Tips/i)).toBeInTheDocument()

    // Switch to Deep Dive
    const deepDiveButton = screen.getByText(/Deep Dive/i)
    fireEvent.click(deepDiveButton)

    // Verify deep dive content appears
    await waitFor(() => {
      expect(screen.getByText(/Phase 1: Preparation/i)).toBeInTheDocument()
    })
  })

  it('should persist panel visibility state', async () => {
    const { rerender } = render(
      <SessionProvider>
        <SessionView />
      </SessionProvider>
    )

    // Start session with Commitment mode
    const commitmentCard = screen.getByText(/Commitment/i)
    fireEvent.click(commitmentCard)
    const startButton = screen.getByText(/Start Session/i)
    fireEvent.click(startButton)

    // Close panel
    await waitFor(() => screen.getByLabelText(/hide panel/i))
    const closeButton = screen.getByLabelText(/hide panel/i)
    fireEvent.click(closeButton)

    // Panel should be hidden
    expect(screen.queryByText(/Guidance/i)).not.toBeInTheDocument()

    // Rerender (simulating component update)
    rerender(
      <SessionProvider>
        <SessionView />
      </SessionProvider>
    )

    // Panel should still be hidden
    expect(screen.queryByText(/Guidance/i)).not.toBeInTheDocument()
  })
})
```

**Step 2: Run test**

Run: `npm run test:run src/__tests__/guidanceIntegration.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/guidanceIntegration.test.tsx
git commit -m "test(integration): add guidance panel integration tests"
```

---

## Task 12: Final Verification & Build

**Step 1: Run all tests**

Run: `npm run test:run`
Expected: All tests passing (338 + new tests)

**Step 2: Run TypeScript build**

Run: `npm run build`
Expected: Success with no errors

**Step 3: Manual testing checklist**

Run: `npm run dev`

Test the following:
- [ ] Guidance panel appears at bottom in Commitment/Listening modes
- [ ] Quick Tips mode shows shuffled tips with auto-rotation
- [ ] Deep Dive mode shows all card sections
- [ ] Mode toggle works smoothly
- [ ] Manual navigation (prev/next) works
- [ ] Panel can be closed and reopened
- [ ] Settings allow customization of behavior
- [ ] Maintain mode respects enableInMaintain setting
- [ ] Dark mode styling looks correct
- [ ] Responsive on mobile (panel adjusts height)
- [ ] Localization works for DE/EN

**Step 4: Commit final verification**

```bash
git add .
git commit -m "test(verification): Phase 10 complete and verified"
```

---

## Execution Summary

**Total tasks:** 12
**Estimated time:** 4-6 hours
**New files:** 14
**Modified files:** 5
**New tests:** ~400 lines
**Test coverage:** Unit, Component, Integration, Accessibility, i18n Parity

**Key Features Delivered:**
- ✅ Large 360px bottom guidance panel
- ✅ Two-tier system (Quick Tips + Deep Dive)
- ✅ Shuffle-based tip rotation
- ✅ Array-based i18n structure (EN/DE parity)
- ✅ Mode-dependent guidance (Maintain toggle)
- ✅ Comprehensive accessibility
- ✅ Settings integration
- ✅ Full test coverage

**Next Steps:**
After this plan is executed, use @finishing-a-development-branch skill to complete the work.

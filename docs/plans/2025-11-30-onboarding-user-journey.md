# Onboarding & User Journey Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Implement comprehensive onboarding experience teaching users the Zwiegespräch method, explaining mode variants with visual timelines, and smoothly guiding them to their first session.

**Architecture:** Modal overlay system with 8-slide carousel built as React components with inline SVG graphics. Reusable PhaseTimeline component for mode breakdowns. Integration via "Take the tour" button in ModeSelectionView. All content localized (DE/EN).

**Tech Stack:** React 18+, TypeScript 5+, Framer Motion (animations), i18next (localization), Vitest + React Testing Library (tests)

---

## Task 1: Create PhaseTimeline Component (Foundation)

**Files:**
- Create: `src/components/onboarding/PhaseTimeline.tsx`
- Create: `src/components/onboarding/__tests__/PhaseTimeline.test.tsx`

**Step 1: Write the failing test**

Create test file with basic rendering test:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhaseTimeline } from '../PhaseTimeline'
import type { PhaseType } from '../../domain/PhaseType'

describe('PhaseTimeline', () => {
  it('renders phase blocks with correct proportions', () => {
    const phases = [
      { type: 'prep' as PhaseType, durationMinutes: 5, speaker: null },
      { type: 'slotA' as PhaseType, durationMinutes: 10, speaker: 'A' as const },
      { type: 'transition' as PhaseType, durationMinutes: 1, speaker: null },
      { type: 'slotB' as PhaseType, durationMinutes: 10, speaker: 'B' as const },
    ]

    render(<PhaseTimeline phases={phases} totalDuration={26} />)

    // Should render all 4 phases
    expect(screen.getByTestId('phase-prep')).toBeInTheDocument()
    expect(screen.getByTestId('phase-slotA')).toBeInTheDocument()
    expect(screen.getByTestId('phase-transition')).toBeInTheDocument()
    expect(screen.getByTestId('phase-slotB')).toBeInTheDocument()
  })

  it('displays phase duration labels', () => {
    const phases = [
      { type: 'prep' as PhaseType, durationMinutes: 5, speaker: null },
    ]

    render(<PhaseTimeline phases={phases} totalDuration={5} />)

    expect(screen.getByText('5 min')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test PhaseTimeline`

Expected: FAIL with "Cannot find module '../PhaseTimeline'"

**Step 3: Create PhaseTimeline component**

Create `src/components/onboarding/PhaseTimeline.tsx`:

```tsx
import { motion } from 'framer-motion'
import type { PhaseConfig } from '../../domain/PhaseConfig'

interface PhaseTimelineProps {
  phases: PhaseConfig[]
  totalDuration: number
}

const PHASE_COLORS: Record<string, string> = {
  prep: '#3B82F6',      // blue
  slotA: '#10B981',     // green
  slotB: '#F59E0B',     // orange
  transition: '#8B5CF6', // purple
  closingA: '#EAB308',  // yellow
  closingB: '#EAB308',  // yellow
  cooldown: '#6B7280',  // gray
}

export function PhaseTimeline({ phases, totalDuration }: PhaseTimelineProps) {
  return (
    <div className="w-full">
      {/* Timeline bar */}
      <div className="flex h-12 rounded-lg overflow-hidden shadow-sm">
        {phases.map((phase, index) => {
          const widthPercent = (phase.durationMinutes / totalDuration) * 100
          const color = PHASE_COLORS[phase.type] || '#6B7280'

          return (
            <motion.div
              key={`${phase.type}-${index}`}
              data-testid={`phase-${phase.type}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              style={{
                width: `${widthPercent}%`,
                backgroundColor: color,
              }}
              className="relative flex items-center justify-center"
            >
              {/* Duration label (only show if width > 8%) */}
              {widthPercent > 8 && (
                <span className="text-xs font-semibold text-white">
                  {phase.durationMinutes} min
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Phase labels below */}
      <div className="flex mt-2 text-xs text-gray-600 dark:text-gray-400">
        {phases.map((phase, index) => {
          const widthPercent = (phase.durationMinutes / totalDuration) * 100

          return (
            <div
              key={`label-${phase.type}-${index}`}
              style={{ width: `${widthPercent}%` }}
              className="text-center"
            >
              {widthPercent > 8 && <span>{phase.type}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test PhaseTimeline`

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/PhaseTimeline.tsx src/components/onboarding/__tests__/PhaseTimeline.test.tsx
git commit -m "feat(onboarding): add PhaseTimeline component with tests"
```

---

## Task 2: Create OnboardingSlider Component

**Files:**
- Create: `src/components/onboarding/OnboardingSlider.tsx`
- Create: `src/components/onboarding/__tests__/OnboardingSlider.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingSlider } from '../OnboardingSlider'

// Mock slides
const TestSlide1 = () => <div>Slide 1 Content</div>
const TestSlide2 = () => <div>Slide 2 Content</div>
const TestSlide3 = () => <div>Slide 3 Content</div>

describe('OnboardingSlider', () => {
  it('renders first slide by default', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    expect(screen.getByText('Slide 1 Content')).toBeInTheDocument()
    expect(screen.queryByText('Slide 2 Content')).not.toBeInTheDocument()
  })

  it('shows progress dots for all slides', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    const { container } = render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    const dots = container.querySelectorAll('[data-testid^="progress-dot-"]')
    expect(dots.length).toBe(3)
  })

  it('navigates to next slide when Next clicked', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    expect(screen.getByText('Slide 2 Content')).toBeInTheDocument()
    expect(screen.queryByText('Slide 1 Content')).not.toBeInTheDocument()
  })

  it('navigates to previous slide when Back clicked', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    // Go to slide 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Go back to slide 1
    fireEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByText('Slide 1 Content')).toBeInTheDocument()
  })

  it('disables Back button on first slide', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    const backButton = screen.getByRole('button', { name: /back/i })
    expect(backButton).toBeDisabled()
  })

  it('calls onComplete when Next clicked on last slide', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    // Navigate to last slide
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Click Next on last slide
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(onComplete).toHaveBeenCalledOnce()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test OnboardingSlider`

Expected: FAIL with "Cannot find module '../OnboardingSlider'"

**Step 3: Create OnboardingSlider component**

Create `src/components/onboarding/OnboardingSlider.tsx`:

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { SessionMode } from '../../domain/SessionMode'

interface OnboardingSliderProps {
  slides: React.ComponentType<SlideProps>[]
  onComplete: (selectedMode?: SessionMode) => void
}

export interface SlideProps {
  onNext?: () => void
  onModeSelect?: (mode: SessionMode) => void
}

export function OnboardingSlider({ slides, onComplete }: OnboardingSliderProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null)

  const isFirst = currentIndex === 0
  const isLast = currentIndex === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete(selectedMode || undefined)
    } else {
      setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1))
    }
  }

  const handleBack = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }

  const handleModeSelect = (mode: SessionMode) => {
    setSelectedMode(mode)
  }

  const CurrentSlide = slides[currentIndex]

  return (
    <div className="flex flex-col h-full">
      {/* Slide content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentSlide onNext={handleNext} onModeSelect={handleModeSelect} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-4">
        {slides.map((_, index) => (
          <div
            key={index}
            data-testid={`progress-dot-${index}`}
            className={`
              h-2 rounded-full transition-all duration-300
              ${index === currentIndex
                ? 'w-8 bg-blue-500'
                : 'w-2 bg-gray-300 dark:bg-gray-600'}
            `}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          disabled={isFirst}
          aria-label={t('onboarding.back', 'Back')}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${isFirst
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
          `}
        >
          {t('onboarding.back', 'Back')}
        </button>

        <button
          onClick={handleNext}
          aria-label={isLast ? t('onboarding.finish', 'Finish') : t('onboarding.next', 'Next')}
          disabled={isLast && !selectedMode}
          className={`
            px-6 py-2 rounded-lg font-semibold transition-colors
            ${isLast && !selectedMode
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'}
          `}
        >
          {isLast ? t('onboarding.finish', 'Start Session') : t('onboarding.next', 'Next')}
        </button>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test OnboardingSlider`

Expected: PASS (6 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/OnboardingSlider.tsx src/components/onboarding/__tests__/OnboardingSlider.test.tsx
git commit -m "feat(onboarding): add OnboardingSlider with navigation and progress"
```

---

## Task 3: Create Slide Components (IntroSlide)

**Files:**
- Create: `src/components/onboarding/slides/IntroSlide.tsx`
- Create: `src/components/onboarding/slides/__tests__/IntroSlide.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IntroSlide } from '../IntroSlide'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

describe('IntroSlide', () => {
  it('renders welcome title', () => {
    render(<IntroSlide />)

    expect(screen.getByText(/Welcome to Couples Timer/i)).toBeInTheDocument()
  })

  it('renders subtitle describing Zwiegespräch', () => {
    render(<IntroSlide />)

    expect(screen.getByText(/structured conversation/i)).toBeInTheDocument()
  })

  it('renders app logo/icon', () => {
    const { container } = render(<IntroSlide />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test IntroSlide`

Expected: FAIL with "Cannot find module '../IntroSlide'"

**Step 3: Create IntroSlide component**

Create `src/components/onboarding/slides/IntroSlide.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function IntroSlide() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <HeartTimerIcon className="w-24 h-24 text-blue-500" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl font-bold text-gray-800 dark:text-white mb-4"
      >
        {t('onboarding.intro.title', 'Welcome to Couples Timer')}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8"
      >
        {t('onboarding.intro.subtitle', 'Your guide for meaningful conversations')}
      </motion.p>

      {/* Description */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-base text-gray-600 dark:text-gray-400 max-w-lg"
      >
        {t('onboarding.intro.description',
          'Zwiegespräch is a structured conversation method for couples. ' +
          'It provides equal speaking time, guided phases, and clear rules to help you connect deeply and communicate effectively.'
        )}
      </motion.p>
    </div>
  )
}

// Icon component
function HeartTimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {/* Heart shape */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
      {/* Clock hands */}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l2 2"
      />
    </svg>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test IntroSlide`

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/slides/IntroSlide.tsx src/components/onboarding/slides/__tests__/IntroSlide.test.tsx
git commit -m "feat(onboarding): add IntroSlide with welcome content"
```

---

## Task 4: Create MoellerMethodSlide

**Files:**
- Create: `src/components/onboarding/slides/MoellerMethodSlide.tsx`
- Create: `src/components/onboarding/slides/__tests__/MoellerMethodSlide.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MoellerMethodSlide } from '../MoellerMethodSlide'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

describe('MoellerMethodSlide', () => {
  it('renders title about Moeller method', () => {
    render(<MoellerMethodSlide />)

    expect(screen.getByText(/Moeller Method/i)).toBeInTheDocument()
  })

  it('renders visual diagram with two speakers', () => {
    const { container } = render(<MoellerMethodSlide />)

    // Should have SVG with speaker illustrations
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('explains core principles', () => {
    render(<MoellerMethodSlide />)

    expect(screen.getByText(/equal speaking time/i)).toBeInTheDocument()
    expect(screen.getByText(/listener stays silent/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test MoellerMethodSlide`

Expected: FAIL with "Cannot find module '../MoellerMethodSlide'"

**Step 3: Create MoellerMethodSlide component**

Create `src/components/onboarding/slides/MoellerMethodSlide.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function MoellerMethodSlide() {
  const { t } = useTranslation()

  return (
    <div className="px-6 py-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        {t('onboarding.moellerMethod.title', 'The Original Moeller Method')}
      </h2>

      {/* Visual Diagram */}
      <div className="max-w-2xl mx-auto mb-8">
        <DiagramSVG />
      </div>

      {/* Core Principles */}
      <div className="max-w-xl mx-auto space-y-4">
        <PrincipleCard
          icon="⚖️"
          title={t('onboarding.moellerMethod.principle1.title', 'Equal Speaking Time')}
          description={t('onboarding.moellerMethod.principle1.desc',
            'Both partners receive the same amount of uninterrupted time to share their thoughts and feelings.'
          )}
        />

        <PrincipleCard
          icon="🤫"
          title={t('onboarding.moellerMethod.principle2.title', 'Listener Stays Silent')}
          description={t('onboarding.moellerMethod.principle2.desc',
            'When one person speaks, the other listens without interrupting, defending, or problem-solving.'
          )}
        />

        <PrincipleCard
          icon="🔄"
          title={t('onboarding.moellerMethod.principle3.title', 'Alternating Turns')}
          description={t('onboarding.moellerMethod.principle3.desc',
            'Partners alternate speaking roles, ensuring both voices are heard equally.'
          )}
        />
      </div>
    </div>
  )
}

// Principle card component
function PrincipleCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </motion.div>
  )
}

// Diagram SVG
function DiagramSVG() {
  return (
    <svg viewBox="0 0 400 200" className="w-full h-auto">
      {/* Speaker A */}
      <g>
        <circle cx="80" cy="100" r="40" fill="#10B981" opacity="0.2" />
        <text x="80" y="105" textAnchor="middle" className="text-xl font-bold fill-green-600">
          A
        </text>
        <text x="80" y="160" textAnchor="middle" className="text-sm fill-gray-600">
          Speaking
        </text>
        {/* Speech bubble */}
        <path
          d="M 120 80 Q 140 70, 160 80 L 160 110 Q 140 120, 120 110 Z"
          fill="#10B981"
          opacity="0.3"
        />
      </g>

      {/* Arrow */}
      <path
        d="M 170 100 L 230 100"
        stroke="#6B7280"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#6B7280" />
        </marker>
      </defs>

      {/* Speaker B */}
      <g>
        <circle cx="320" cy="100" r="40" fill="#F59E0B" opacity="0.2" />
        <text x="320" y="105" textAnchor="middle" className="text-xl font-bold fill-orange-600">
          B
        </text>
        <text x="320" y="160" textAnchor="middle" className="text-sm fill-gray-600">
          Listening
        </text>
        {/* Ear icon */}
        <path
          d="M 310 90 Q 305 95, 310 100 Q 305 105, 310 110"
          stroke="#F59E0B"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test MoellerMethodSlide`

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/slides/MoellerMethodSlide.tsx src/components/onboarding/slides/__tests__/MoellerMethodSlide.test.tsx
git commit -m "feat(onboarding): add MoellerMethodSlide with core principles"
```

---

## Task 5: Create AdaptationsSlide

**Files:**
- Create: `src/components/onboarding/slides/AdaptationsSlide.tsx`
- Create: `src/components/onboarding/slides/__tests__/AdaptationsSlide.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdaptationsSlide } from '../AdaptationsSlide'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

describe('AdaptationsSlide', () => {
  it('renders title about adaptations', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/Our Adaptations/i)).toBeInTheDocument()
  })

  it('explains 1-minute silent transitions', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/1-minute/i)).toBeInTheDocument()
    expect(screen.getByText(/transition/i)).toBeInTheDocument()
  })

  it('mentions singing bowl audio cues', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/singing bowl/i)).toBeInTheDocument()
  })

  it('mentions digital timer management', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/timer/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test AdaptationsSlide`

Expected: FAIL with "Cannot find module '../AdaptationsSlide'"

**Step 3: Create AdaptationsSlide component**

Create `src/components/onboarding/slides/AdaptationsSlide.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function AdaptationsSlide() {
  const { t } = useTranslation()

  return (
    <div className="px-6 py-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        {t('onboarding.adaptations.title', 'Our Adaptations')}
      </h2>

      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
        {t('onboarding.adaptations.intro',
          'We\'ve enhanced the original Moeller method with features designed to support emotional regulation and ease of use.'
        )}
      </p>

      {/* Comparison Layout */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
        {/* Original */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 text-center">
            {t('onboarding.adaptations.original', 'Original Moeller')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>✓ Equal speaking time</li>
            <li>✓ Silent listening</li>
            <li>✓ Alternating speakers</li>
            <li>— Manual timing</li>
            <li>— Immediate speaker switch</li>
          </ul>
        </div>

        {/* Couples Timer */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4 text-center">
            {t('onboarding.adaptations.couplesTimer', 'Couples Timer')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>✓ Equal speaking time</li>
            <li>✓ Silent listening</li>
            <li>✓ Alternating speakers</li>
            <li className="font-semibold text-blue-600 dark:text-blue-400">
              + Digital timer management
            </li>
            <li className="font-semibold text-blue-600 dark:text-blue-400">
              + 1-minute silent transitions
            </li>
          </ul>
        </div>
      </div>

      {/* Key Adaptations */}
      <div className="max-w-2xl mx-auto space-y-4">
        <AdaptationCard
          icon="🔕"
          title={t('onboarding.adaptations.adaptation1.title', '1-Minute Silent Transitions')}
          description={t('onboarding.adaptations.adaptation1.desc',
            'After each speaking phase, a 1-minute silence allows both partners to process emotions and reset before the next phase begins.'
          )}
        />

        <AdaptationCard
          icon="🔔"
          title={t('onboarding.adaptations.adaptation2.title', 'Singing Bowl Audio Cues')}
          description={t('onboarding.adaptations.adaptation2.desc',
            'Gentle singing bowl sounds mark phase transitions, removing the burden of timekeeping and allowing you to stay present.'
          )}
        />

        <AdaptationCard
          icon="⏱️"
          title={t('onboarding.adaptations.adaptation3.title', 'Automatic Timer Management')}
          description={t('onboarding.adaptations.adaptation3.desc',
            'The app handles all timing automatically, ensuring fairness and removing the need to watch the clock.'
          )}
        />
      </div>
    </div>
  )
}

// Adaptation card component
function AdaptationCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </motion.div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test AdaptationsSlide`

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/slides/AdaptationsSlide.tsx src/components/onboarding/slides/__tests__/AdaptationsSlide.test.tsx
git commit -m "feat(onboarding): add AdaptationsSlide explaining custom features"
```

---

## Task 6: Create Mode Breakdown Slides (Maintain, Commitment, Listening)

**Files:**
- Create: `src/components/onboarding/slides/MaintainModeSlide.tsx`
- Create: `src/components/onboarding/slides/CommitmentModeSlide.tsx`
- Create: `src/components/onboarding/slides/ListeningModeSlide.tsx`
- Create: `src/components/onboarding/slides/__tests__/ModeBreakdownSlides.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MaintainModeSlide } from '../MaintainModeSlide'
import { CommitmentModeSlide } from '../CommitmentModeSlide'
import { ListeningModeSlide } from '../ListeningModeSlide'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

describe('Mode Breakdown Slides', () => {
  describe('MaintainModeSlide', () => {
    it('renders Maintain mode title and duration', () => {
      render(<MaintainModeSlide />)

      expect(screen.getByText(/Maintain/i)).toBeInTheDocument()
      expect(screen.getByText(/90/i)).toBeInTheDocument() // 90 minutes
    })

    it('renders PhaseTimeline component', () => {
      const { container } = render(<MaintainModeSlide />)

      // PhaseTimeline renders phase blocks
      expect(container.querySelector('[data-testid^="phase-"]')).toBeInTheDocument()
    })

    it('shows round count', () => {
      render(<MaintainModeSlide />)

      expect(screen.getByText(/3.*round/i)).toBeInTheDocument()
    })
  })

  describe('CommitmentModeSlide', () => {
    it('renders Commitment mode title and duration', () => {
      render(<CommitmentModeSlide />)

      expect(screen.getByText(/Commitment/i)).toBeInTheDocument()
      expect(screen.getByText(/60/i)).toBeInTheDocument() // 60 minutes
    })

    it('renders PhaseTimeline component', () => {
      const { container } = render(<CommitmentModeSlide />)

      expect(container.querySelector('[data-testid^="phase-"]')).toBeInTheDocument()
    })
  })

  describe('ListeningModeSlide', () => {
    it('renders Listening mode title and duration', () => {
      render(<ListeningModeSlide />)

      expect(screen.getByText(/Listening/i)).toBeInTheDocument()
      expect(screen.getByText(/45/i)).toBeInTheDocument() // 45 minutes
    })

    it('renders PhaseTimeline component', () => {
      const { container } = render(<ListeningModeSlide />)

      expect(container.querySelector('[data-testid^="phase-"]')).toBeInTheDocument()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test ModeBreakdownSlides`

Expected: FAIL with "Cannot find module '../MaintainModeSlide'"

**Step 3: Create MaintainModeSlide component**

Create `src/components/onboarding/slides/MaintainModeSlide.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { PhaseTimeline } from '../PhaseTimeline'
import { MAINTAIN_MODE } from '../../../domain/SessionMode'

export function MaintainModeSlide() {
  const { t } = useTranslation()

  const totalDuration = MAINTAIN_MODE.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-4">
          {t('onboarding.modes.maintain.badge', 'Weekly Relationship Maintenance')}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {t('onboarding.modes.maintain.title', 'Maintain Mode')}
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('onboarding.modes.maintain.duration', '~90 minutes • 3 Rounds × 15 min')}
        </p>
      </div>

      {/* Description */}
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        {t('onboarding.modes.maintain.description',
          'The classic weekly Zwiegespräch for ongoing relationship care. Three rounds of 15-minute speaking slots allow deep, unhurried conversation.'
        )}
      </p>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto mb-8">
        <PhaseTimeline phases={MAINTAIN_MODE.phases} totalDuration={totalDuration} />
      </div>

      {/* Phase breakdown */}
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4 text-sm">
        <PhaseInfo label={t('onboarding.modes.prep', 'Preparation')} duration="5 min" color="bg-blue-100 dark:bg-blue-900/30" />
        <PhaseInfo label={t('onboarding.modes.speaking', 'Speaking Slots')} duration="15 min each" color="bg-green-100 dark:bg-green-900/30" />
        <PhaseInfo label={t('onboarding.modes.transition', 'Transitions')} duration="1 min" color="bg-purple-100 dark:bg-purple-900/30" />
        <PhaseInfo label={t('onboarding.modes.closing', 'Closing')} duration="5 min each" color="bg-yellow-100 dark:bg-yellow-900/30" />
      </div>

      {/* Recommendation */}
      <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 max-w-2xl mx-auto">
        <p className="text-sm text-green-800 dark:text-green-300">
          <strong>{t('onboarding.modes.maintain.recommendedFor', 'Recommended for:')}</strong>{' '}
          {t('onboarding.modes.maintain.useCase',
            'Couples who want regular, weekly relationship check-ins. Ideal for maintaining connection and addressing issues before they grow.'
          )}
        </p>
      </div>
    </div>
  )
}

function PhaseInfo({ label, duration, color }: { label: string; duration: string; color: string }) {
  return (
    <div className={`${color} rounded-lg p-3 text-center`}>
      <div className="font-semibold text-gray-800 dark:text-white">{label}</div>
      <div className="text-gray-600 dark:text-gray-400">{duration}</div>
    </div>
  )
}
```

**Step 4: Create CommitmentModeSlide component**

Create `src/components/onboarding/slides/CommitmentModeSlide.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { PhaseTimeline } from '../PhaseTimeline'
import { COMMITMENT_MODE } from '../../../domain/SessionMode'

export function CommitmentModeSlide() {
  const { t } = useTranslation()

  const totalDuration = COMMITMENT_MODE.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold mb-4">
          {t('onboarding.modes.commitment.badge', 'Crisis Support')}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {t('onboarding.modes.commitment.title', 'Commitment Mode')}
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('onboarding.modes.commitment.duration', '~60 minutes • 3 Rounds × 10 min')}
        </p>
      </div>

      {/* Description */}
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        {t('onboarding.modes.commitment.description',
          'Shorter, more frequent sessions for couples in crisis. Use 2-3 times per week to stabilize and rebuild connection during difficult periods.'
        )}
      </p>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto mb-8">
        <PhaseTimeline phases={COMMITMENT_MODE.phases} totalDuration={totalDuration} />
      </div>

      {/* Phase breakdown */}
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4 text-sm">
        <PhaseInfo label={t('onboarding.modes.prep', 'Preparation')} duration="5 min" color="bg-blue-100 dark:bg-blue-900/30" />
        <PhaseInfo label={t('onboarding.modes.speaking', 'Speaking Slots')} duration="10 min each" color="bg-orange-100 dark:bg-orange-900/30" />
        <PhaseInfo label={t('onboarding.modes.transition', 'Transitions')} duration="1 min" color="bg-purple-100 dark:bg-purple-900/30" />
        <PhaseInfo label={t('onboarding.modes.closing', 'Closing')} duration="5 min each" color="bg-yellow-100 dark:bg-yellow-900/30" />
      </div>

      {/* Recommendation */}
      <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 max-w-2xl mx-auto">
        <p className="text-sm text-orange-800 dark:text-orange-300">
          <strong>{t('onboarding.modes.commitment.recommendedFor', 'Recommended for:')}</strong>{' '}
          {t('onboarding.modes.commitment.useCase',
            'Couples facing challenges who need more frequent touchpoints. The shorter format makes it easier to commit to 2-3 sessions per week.'
          )}
        </p>
      </div>
    </div>
  )
}

function PhaseInfo({ label, duration, color }: { label: string; duration: string; color: string }) {
  return (
    <div className={`${color} rounded-lg p-3 text-center`}>
      <div className="font-semibold text-gray-800 dark:text-white">{label}</div>
      <div className="text-gray-600 dark:text-gray-400">{duration}</div>
    </div>
  )
}
```

**Step 5: Create ListeningModeSlide component**

Create `src/components/onboarding/slides/ListeningModeSlide.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { PhaseTimeline } from '../PhaseTimeline'
import { LISTENING_MODE } from '../../../domain/SessionMode'

export function ListeningModeSlide() {
  const { t } = useTranslation()

  const totalDuration = LISTENING_MODE.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
          {t('onboarding.modes.listening.badge', 'Beginner Friendly')}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {t('onboarding.modes.listening.title', 'Listening Mode')}
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('onboarding.modes.listening.duration', '~45 minutes • 2 Rounds × 10 min')}
        </p>
      </div>

      {/* Description */}
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        {t('onboarding.modes.listening.description',
          'A shorter introduction to Zwiegespräch. Perfect for first-timers or when you have limited time. Includes more guidance throughout.'
        )}
      </p>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto mb-8">
        <PhaseTimeline phases={LISTENING_MODE.phases} totalDuration={totalDuration} />
      </div>

      {/* Phase breakdown */}
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4 text-sm">
        <PhaseInfo label={t('onboarding.modes.prep', 'Preparation')} duration="5 min" color="bg-blue-100 dark:bg-blue-900/30" />
        <PhaseInfo label={t('onboarding.modes.speaking', 'Speaking Slots')} duration="10 min each" color="bg-blue-100 dark:bg-blue-900/30" />
        <PhaseInfo label={t('onboarding.modes.transition', 'Transitions')} duration="1 min" color="bg-purple-100 dark:bg-purple-900/30" />
        <PhaseInfo label={t('onboarding.modes.cooldown', 'Cooldown')} duration="5 min" color="bg-gray-100 dark:bg-gray-700" />
      </div>

      {/* Recommendation */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-2xl mx-auto">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>{t('onboarding.modes.listening.recommendedFor', 'Recommended for:')}</strong>{' '}
          {t('onboarding.modes.listening.useCase',
            'Couples new to Zwiegespräch or those with busy schedules. The shorter duration and additional guidance make it easy to get started.'
          )}
        </p>
      </div>
    </div>
  )
}

function PhaseInfo({ label, duration, color }: { label: string; duration: string; color: string }) {
  return (
    <div className={`${color} rounded-lg p-3 text-center`}>
      <div className="font-semibold text-gray-800 dark:text-white">{label}</div>
      <div className="text-gray-600 dark:text-gray-400">{duration}</div>
    </div>
  )
}
```

**Step 6: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test ModeBreakdownSlides`

Expected: PASS (9 tests)

**Step 7: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/slides/MaintainModeSlide.tsx src/components/onboarding/slides/CommitmentModeSlide.tsx src/components/onboarding/slides/ListeningModeSlide.tsx src/components/onboarding/slides/__tests__/ModeBreakdownSlides.test.tsx
git commit -m "feat(onboarding): add mode breakdown slides with timelines"
```

---

## Task 7: Create CustomModeSlide and ReadyToStartSlide

**Files:**
- Create: `src/components/onboarding/slides/CustomModeSlide.tsx`
- Create: `src/components/onboarding/slides/ReadyToStartSlide.tsx`
- Create: `src/components/onboarding/slides/__tests__/FinalSlides.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CustomModeSlide } from '../CustomModeSlide'
import { ReadyToStartSlide } from '../ReadyToStartSlide'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

describe('Final Slides', () => {
  describe('CustomModeSlide', () => {
    it('renders title about custom mode', () => {
      render(<CustomModeSlide />)

      expect(screen.getByText(/Custom Mode/i)).toBeInTheDocument()
    })

    it('indicates this is for advanced users', () => {
      render(<CustomModeSlide />)

      expect(screen.getByText(/advanced/i)).toBeInTheDocument()
    })

    it('shows builder/customization visualization', () => {
      const { container } = render(<CustomModeSlide />)

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('ReadyToStartSlide', () => {
    it('renders call to action title', () => {
      render(<ReadyToStartSlide />)

      expect(screen.getByText(/Ready to Start/i)).toBeInTheDocument()
    })

    it('renders mode selection cards', () => {
      render(<ReadyToStartSlide />)

      expect(screen.getByText(/Maintain/i)).toBeInTheDocument()
      expect(screen.getByText(/Commitment/i)).toBeInTheDocument()
      expect(screen.getByText(/Listening/i)).toBeInTheDocument()
      expect(screen.getByText(/Custom/i)).toBeInTheDocument()
    })

    it('calls onModeSelect when mode card clicked', () => {
      const onModeSelect = vi.fn()

      render(<ReadyToStartSlide onModeSelect={onModeSelect} />)

      const maintainCard = screen.getByText(/Maintain/i).closest('button')
      fireEvent.click(maintainCard!)

      expect(onModeSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Maintain' }))
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test FinalSlides`

Expected: FAIL with "Cannot find module '../CustomModeSlide'"

**Step 3: Create CustomModeSlide component**

Create `src/components/onboarding/slides/CustomModeSlide.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function CustomModeSlide() {
  const { t } = useTranslation()

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold mb-4">
          {t('onboarding.modes.custom.badge', 'Advanced Option')}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {t('onboarding.modes.custom.title', 'Custom Mode')}
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('onboarding.modes.custom.subtitle', 'Build Your Own Sequence')}
        </p>
      </div>

      {/* Description */}
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        {t('onboarding.modes.custom.description',
          'Once you\'re comfortable with the preset modes, you can create your own custom sequences tailored to your specific needs and schedule.'
        )}
      </p>

      {/* Builder Mockup */}
      <div className="max-w-3xl mx-auto mb-8">
        <BuilderMockupSVG />
      </div>

      {/* Features */}
      <div className="max-w-2xl mx-auto space-y-3">
        <FeatureItem
          icon="⏱️"
          text={t('onboarding.modes.custom.feature1', 'Choose duration for each speaking slot')}
        />
        <FeatureItem
          icon="🔄"
          text={t('onboarding.modes.custom.feature2', 'Select number of rounds (1-5)')}
        />
        <FeatureItem
          icon="💾"
          text={t('onboarding.modes.custom.feature3', 'Save and reuse your custom sequences')}
        />
      </div>

      {/* Note */}
      <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 max-w-2xl mx-auto">
        <p className="text-sm text-purple-800 dark:text-purple-300">
          💡 {t('onboarding.modes.custom.tip',
            'We recommend starting with a preset mode to get familiar with Zwiegespräch before creating custom sequences.'
          )}
        </p>
      </div>
    </div>
  )
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-700 dark:text-gray-300">{text}</span>
    </motion.div>
  )
}

function BuilderMockupSVG() {
  return (
    <svg viewBox="0 0 500 200" className="w-full h-auto">
      {/* Mock UI elements */}
      <rect x="50" y="40" width="400" height="30" rx="5" fill="#E5E7EB" />
      <text x="60" y="62" className="text-sm fill-gray-600">
        Select speaking duration: 10 min
      </text>

      <rect x="50" y="90" width="400" height="30" rx="5" fill="#E5E7EB" />
      <text x="60" y="112" className="text-sm fill-gray-600">
        Number of rounds: 3
      </text>

      {/* Phase blocks preview */}
      <g transform="translate(50, 140)">
        <rect x="0" y="0" width="80" height="40" rx="5" fill="#3B82F6" opacity="0.3" />
        <rect x="90" y="0" width="120" height="40" rx="5" fill="#10B981" opacity="0.3" />
        <rect x="220" y="0" width="30" height="40" rx="5" fill="#8B5CF6" opacity="0.3" />
        <rect x="260" y="0" width="120" height="40" rx="5" fill="#F59E0B" opacity="0.3" />
      </g>
    </svg>
  )
}
```

**Step 4: Create ReadyToStartSlide component**

Create `src/components/onboarding/slides/ReadyToStartSlide.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { SlideProps } from '../OnboardingSlider'
import type { SessionMode } from '../../../domain/SessionMode'
import { MAINTAIN_MODE, COMMITMENT_MODE, LISTENING_MODE } from '../../../domain/SessionMode'

export function ReadyToStartSlide({ onModeSelect }: SlideProps) {
  const { t } = useTranslation()

  const modes = [
    { mode: MAINTAIN_MODE, color: 'green', emoji: '🌱' },
    { mode: COMMITMENT_MODE, color: 'orange', emoji: '🤝' },
    { mode: LISTENING_MODE, color: 'blue', emoji: '👂' },
  ]

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          {t('onboarding.readyToStart.title', 'Ready to Start?')}
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          {t('onboarding.readyToStart.subtitle',
            'Choose a mode that fits your needs and schedule. You can always change it later.'
          )}
        </p>
      </div>

      {/* Mode cards */}
      <div className="max-w-2xl mx-auto space-y-4 mb-6">
        {modes.map(({ mode, color, emoji }, index) => (
          <ModeCard
            key={mode.name}
            mode={mode}
            color={color}
            emoji={emoji}
            index={index}
            onSelect={onModeSelect}
          />
        ))}

        {/* Custom mode card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          onClick={() => onModeSelect?.({ name: 'Custom', phases: [] } as SessionMode)}
          className="
            w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600
            hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20
            transition-all text-left
          "
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">⚙️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {t('modes.custom.name', 'Custom')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('onboarding.readyToStart.custom.desc', 'Build your own sequence (Advanced)')}
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Footer note */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        {t('onboarding.readyToStart.note',
          'Select a mode above, then click "Start Session" to begin your first Zwiegespräch.'
        )}
      </p>
    </div>
  )
}

function ModeCard({
  mode,
  color,
  emoji,
  index,
  onSelect
}: {
  mode: SessionMode
  color: string
  emoji: string
  index: number
  onSelect?: (mode: SessionMode) => void
}) {
  const { t } = useTranslation()

  const colorClasses = {
    green: 'border-green-200 dark:border-green-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
    orange: 'border-orange-200 dark:border-orange-800 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
    blue: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  }

  const totalMinutes = mode.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={() => onSelect?.(mode)}
      className={`
        w-full p-4 rounded-xl border-2 transition-all text-left
        ${colorClasses[color as keyof typeof colorClasses]}
      `}
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{emoji}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            {t(`modes.${mode.name.toLowerCase()}.name`, mode.name)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(`modes.${mode.name.toLowerCase()}.tagline`, mode.tagline)} • ~{totalMinutes} min
          </p>
        </div>
      </div>
    </motion.button>
  )
}
```

**Step 5: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test FinalSlides`

Expected: PASS (7 tests)

**Step 6: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/slides/CustomModeSlide.tsx src/components/onboarding/slides/ReadyToStartSlide.tsx src/components/onboarding/slides/__tests__/FinalSlides.test.tsx
git commit -m "feat(onboarding): add CustomModeSlide and ReadyToStartSlide"
```

---

## Task 8: Create OnboardingModal Component

**Files:**
- Create: `src/components/onboarding/OnboardingModal.tsx`
- Create: `src/components/onboarding/__tests__/OnboardingModal.test.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingModal } from '../OnboardingModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('OnboardingModal', () => {
  it('renders when isOpen is true', () => {
    const onClose = vi.fn()
    const onComplete = vi.fn()

    render(<OnboardingModal isOpen={true} onClose={onClose} onComplete={onComplete} />)

    expect(screen.getByText(/Welcome to Couples Timer/i)).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    const onClose = vi.fn()
    const onComplete = vi.fn()

    const { container } = render(<OnboardingModal isOpen={false} onClose={onClose} onComplete={onComplete} />)

    expect(container.firstChild).toBeNull()
  })

  it('shows skip button', () => {
    const onClose = vi.fn()
    const onComplete = vi.fn()

    render(<OnboardingModal isOpen={true} onClose={onClose} onComplete={onComplete} />)

    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  it('calls onClose when skip button clicked', () => {
    const onClose = vi.fn()
    const onComplete = vi.fn()

    render(<OnboardingModal isOpen={true} onClose={onClose} onComplete={onComplete} />)

    const skipButton = screen.getByRole('button', { name: /skip/i })
    fireEvent.click(skipButton)

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onComplete when slider finishes', () => {
    const onClose = vi.fn()
    const onComplete = vi.fn()

    render(<OnboardingModal isOpen={true} onClose={onClose} onComplete={onComplete} />)

    // Navigate through all slides
    const nextButton = screen.getByRole('button', { name: /next/i })
    for (let i = 0; i < 8; i++) {
      fireEvent.click(nextButton)
    }

    expect(onComplete).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test OnboardingModal`

Expected: FAIL with "Cannot find module '../OnboardingModal'"

**Step 3: Create OnboardingModal component**

Create `src/components/onboarding/OnboardingModal.tsx`:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { OnboardingSlider } from './OnboardingSlider'
import { IntroSlide } from './slides/IntroSlide'
import { MoellerMethodSlide } from './slides/MoellerMethodSlide'
import { AdaptationsSlide } from './slides/AdaptationsSlide'
import { MaintainModeSlide } from './slides/MaintainModeSlide'
import { CommitmentModeSlide } from './slides/CommitmentModeSlide'
import { ListeningModeSlide } from './slides/ListeningModeSlide'
import { CustomModeSlide } from './slides/CustomModeSlide'
import { ReadyToStartSlide } from './slides/ReadyToStartSlide'
import type { SessionMode } from '../../domain/SessionMode'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (selectedMode?: SessionMode) => void
}

const SLIDES = [
  IntroSlide,
  MoellerMethodSlide,
  AdaptationsSlide,
  MaintainModeSlide,
  CommitmentModeSlide,
  ListeningModeSlide,
  CustomModeSlide,
  ReadyToStartSlide,
]

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleComplete = (selectedMode?: SessionMode) => {
    onComplete(selectedMode)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="
              w-full h-full sm:h-[90vh] sm:max-w-4xl
              bg-white dark:bg-gray-900
              sm:rounded-2xl shadow-2xl
              flex flex-col
              relative
            "
          >
            {/* Skip button */}
            <button
              onClick={onClose}
              aria-label={t('onboarding.skip', 'Skip tour')}
              className="
                absolute top-4 right-4 z-10
                px-3 py-1 rounded-lg
                text-sm text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors
              "
            >
              {t('onboarding.skip', 'Skip tour')}
            </button>

            {/* Slider */}
            <OnboardingSlider slides={SLIDES} onComplete={handleComplete} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test OnboardingModal`

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/onboarding/OnboardingModal.tsx src/components/onboarding/__tests__/OnboardingModal.test.tsx
git commit -m "feat(onboarding): add OnboardingModal with complete slide flow"
```

---

## Task 9: Integrate Onboarding into ModeSelectionView

**Files:**
- Modify: `src/components/SessionView.tsx`
- Create: `src/components/__tests__/SessionView.onboarding.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/SessionView.onboarding.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionView } from '../SessionView'
import { SessionProvider } from '../../contexts/SessionContext'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('SessionView - Onboarding Integration', () => {
  it('shows "Take the tour" button on mode selection screen', () => {
    render(
      <SessionProvider>
        <SessionView />
      </SessionProvider>
    )

    expect(screen.getByRole('button', { name: /take the tour/i })).toBeInTheDocument()
  })

  it('opens onboarding modal when "Take the tour" clicked', () => {
    render(
      <SessionProvider>
        <SessionView />
      </SessionProvider>
    )

    const tourButton = screen.getByRole('button', { name: /take the tour/i })
    fireEvent.click(tourButton)

    expect(screen.getByText(/Welcome to Couples Timer/i)).toBeInTheDocument()
  })

  it('closes onboarding modal when skip clicked', () => {
    render(
      <SessionProvider>
        <SessionView />
      </SessionProvider>
    )

    // Open modal
    const tourButton = screen.getByRole('button', { name: /take the tour/i })
    fireEvent.click(tourButton)

    // Close modal
    const skipButton = screen.getByRole('button', { name: /skip/i })
    fireEvent.click(skipButton)

    expect(screen.queryByText(/Welcome to Couples Timer/i)).not.toBeInTheDocument()
  })

  it('starts session with selected mode after onboarding completion', async () => {
    render(
      <SessionProvider>
        <SessionView />
      </SessionProvider>
    )

    // Open onboarding
    const tourButton = screen.getByRole('button', { name: /take the tour/i })
    fireEvent.click(tourButton)

    // Navigate to last slide and select mode
    const nextButton = screen.getByRole('button', { name: /next/i })
    for (let i = 0; i < 7; i++) {
      fireEvent.click(nextButton)
    }

    // Select Maintain mode
    const maintainCard = screen.getByText(/Maintain/i).closest('button')
    fireEvent.click(maintainCard!)

    // Complete onboarding
    const startButton = screen.getByRole('button', { name: /start session/i })
    fireEvent.click(startButton)

    // Should start session
    await waitFor(() => {
      expect(screen.getByText(/Maintain/i)).toBeInTheDocument()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test SessionView.onboarding`

Expected: FAIL with "Unable to find button with name /take the tour/i"

**Step 3: Modify SessionView to add onboarding integration**

Edit `src/components/SessionView.tsx`, find the `ModeSelectionView` component and add:

```tsx
import { useState } from 'react'
import { OnboardingModal } from './onboarding/OnboardingModal'
// ... existing imports ...

function ModeSelectionView({
  selectedMode,
  onSelectMode,
}: {
  selectedMode: SessionMode | null
  onSelectMode: (mode: SessionMode | null) => void
}) {
  const { t } = useTranslation()
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleOnboardingComplete = (mode?: SessionMode) => {
    setShowOnboarding(false)
    if (mode) {
      onSelectMode(mode)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Tour button */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="
                px-3 py-2 rounded-lg
                text-sm font-medium
                text-blue-600 dark:text-blue-400
                hover:bg-blue-50 dark:hover:bg-blue-900/20
                transition-colors
              "
            >
              {t('onboarding.takeTour', 'Take the tour')}
            </button>
          </div>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {t('app.title', 'Couples Timer')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('app.subtitle', 'Structured conversation for couples')}
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <SettingsButton />
          </div>
        </div>
      </header>

      {/* Mode selection */}
      <main className="flex-1 px-4 py-6">
        <ModeSelector
          selectedMode={selectedMode}
          onSelectMode={onSelectMode}
        />
      </main>

      {/* Start button */}
      <footer className="px-4 py-6">
        <AnimatePresence>
          {selectedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <StartButton mode={selectedMode} fullWidth />
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test SessionView.onboarding`

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/components/SessionView.tsx src/components/__tests__/SessionView.onboarding.test.tsx
git commit -m "feat(onboarding): integrate onboarding modal into ModeSelectionView"
```

---

## Task 10: Add i18n Translations (English & German)

**Files:**
- Modify: `src/i18n/en/translation.json`
- Modify: `src/i18n/de/translation.json`

**Step 1: Add English translations**

Edit `src/i18n/en/translation.json` and add onboarding keys:

```json
{
  "onboarding": {
    "takeTour": "Take the tour",
    "skip": "Skip tour",
    "back": "Back",
    "next": "Next",
    "finish": "Start Session",
    "intro": {
      "title": "Welcome to Couples Timer",
      "subtitle": "Your guide for meaningful conversations",
      "description": "Zwiegespräch is a structured conversation method for couples. It provides equal speaking time, guided phases, and clear rules to help you connect deeply and communicate effectively."
    },
    "moellerMethod": {
      "title": "The Original Moeller Method",
      "principle1": {
        "title": "Equal Speaking Time",
        "desc": "Both partners receive the same amount of uninterrupted time to share their thoughts and feelings."
      },
      "principle2": {
        "title": "Listener Stays Silent",
        "desc": "When one person speaks, the other listens without interrupting, defending, or problem-solving."
      },
      "principle3": {
        "title": "Alternating Turns",
        "desc": "Partners alternate speaking roles, ensuring both voices are heard equally."
      }
    },
    "adaptations": {
      "title": "Our Adaptations",
      "intro": "We've enhanced the original Moeller method with features designed to support emotional regulation and ease of use.",
      "original": "Original Moeller",
      "couplesTimer": "Couples Timer",
      "adaptation1": {
        "title": "1-Minute Silent Transitions",
        "desc": "After each speaking phase, a 1-minute silence allows both partners to process emotions and reset before the next phase begins."
      },
      "adaptation2": {
        "title": "Singing Bowl Audio Cues",
        "desc": "Gentle singing bowl sounds mark phase transitions, removing the burden of timekeeping and allowing you to stay present."
      },
      "adaptation3": {
        "title": "Automatic Timer Management",
        "desc": "The app handles all timing automatically, ensuring fairness and removing the need to watch the clock."
      }
    },
    "modes": {
      "prep": "Preparation",
      "speaking": "Speaking Slots",
      "transition": "Transitions",
      "closing": "Closing",
      "cooldown": "Cooldown",
      "maintain": {
        "badge": "Weekly Relationship Maintenance",
        "title": "Maintain Mode",
        "duration": "~90 minutes • 3 Rounds × 15 min",
        "description": "The classic weekly Zwiegespräch for ongoing relationship care. Three rounds of 15-minute speaking slots allow deep, unhurried conversation.",
        "recommendedFor": "Recommended for:",
        "useCase": "Couples who want regular, weekly relationship check-ins. Ideal for maintaining connection and addressing issues before they grow."
      },
      "commitment": {
        "badge": "Crisis Support",
        "title": "Commitment Mode",
        "duration": "~60 minutes • 3 Rounds × 10 min",
        "description": "Shorter, more frequent sessions for couples in crisis. Use 2-3 times per week to stabilize and rebuild connection during difficult periods.",
        "recommendedFor": "Recommended for:",
        "useCase": "Couples facing challenges who need more frequent touchpoints. The shorter format makes it easier to commit to 2-3 sessions per week."
      },
      "listening": {
        "badge": "Beginner Friendly",
        "title": "Listening Mode",
        "duration": "~45 minutes • 2 Rounds × 10 min",
        "description": "A shorter introduction to Zwiegespräch. Perfect for first-timers or when you have limited time. Includes more guidance throughout.",
        "recommendedFor": "Recommended for:",
        "useCase": "Couples new to Zwiegespräch or those with busy schedules. The shorter duration and additional guidance make it easy to get started."
      },
      "custom": {
        "badge": "Advanced Option",
        "title": "Custom Mode",
        "subtitle": "Build Your Own Sequence",
        "description": "Once you're comfortable with the preset modes, you can create your own custom sequences tailored to your specific needs and schedule.",
        "feature1": "Choose duration for each speaking slot",
        "feature2": "Select number of rounds (1-5)",
        "feature3": "Save and reuse your custom sequences",
        "tip": "We recommend starting with a preset mode to get familiar with Zwiegespräch before creating custom sequences."
      }
    },
    "readyToStart": {
      "title": "Ready to Start?",
      "subtitle": "Choose a mode that fits your needs and schedule. You can always change it later.",
      "custom": {
        "desc": "Build your own sequence (Advanced)"
      },
      "note": "Select a mode above, then click \"Start Session\" to begin your first Zwiegespräch."
    }
  }
}
```

**Step 2: Add German translations**

Edit `src/i18n/de/translation.json` and add German onboarding keys:

```json
{
  "onboarding": {
    "takeTour": "Tour starten",
    "skip": "Überspringen",
    "back": "Zurück",
    "next": "Weiter",
    "finish": "Session starten",
    "intro": {
      "title": "Willkommen beim Couples Timer",
      "subtitle": "Ihr Leitfaden für bedeutungsvolle Gespräche",
      "description": "Zwiegespräch ist eine strukturierte Gesprächsmethode für Paare. Es bietet gleiche Sprechzeiten, geführte Phasen und klare Regeln, um tief zu verbinden und effektiv zu kommunizieren."
    },
    "moellerMethod": {
      "title": "Die originale Moeller-Methode",
      "principle1": {
        "title": "Gleiche Sprechzeit",
        "desc": "Beide Partner erhalten die gleiche Zeit, um ungestört ihre Gedanken und Gefühle zu teilen."
      },
      "principle2": {
        "title": "Zuhörer bleibt still",
        "desc": "Wenn eine Person spricht, hört die andere zu, ohne zu unterbrechen, zu verteidigen oder Lösungen anzubieten."
      },
      "principle3": {
        "title": "Abwechselnde Rollen",
        "desc": "Die Partner wechseln sich beim Sprechen ab, damit beide Stimmen gleichermaßen gehört werden."
      }
    },
    "adaptations": {
      "title": "Unsere Anpassungen",
      "intro": "Wir haben die originale Moeller-Methode mit Funktionen erweitert, die emotionale Regulation und einfache Nutzung unterstützen.",
      "original": "Original Moeller",
      "couplesTimer": "Couples Timer",
      "adaptation1": {
        "title": "1-Minütige stille Übergänge",
        "desc": "Nach jeder Sprechphase ermöglicht eine 1-minütige Stille beiden Partnern, Emotionen zu verarbeiten und sich zurückzusetzen, bevor die nächste Phase beginnt."
      },
      "adaptation2": {
        "title": "Klangschalen-Audio-Signale",
        "desc": "Sanfte Klangschalen-Töne markieren Phasenübergänge, entlasten von der Zeitmessung und ermöglichen es Ihnen, präsent zu bleiben."
      },
      "adaptation3": {
        "title": "Automatische Zeitverwaltung",
        "desc": "Die App übernimmt die gesamte Zeitmessung automatisch, gewährleistet Fairness und nimmt Ihnen die Notwendigkeit, auf die Uhr zu schauen."
      }
    },
    "modes": {
      "prep": "Vorbereitung",
      "speaking": "Sprechfenster",
      "transition": "Übergänge",
      "closing": "Abschluss",
      "cooldown": "Cooldown",
      "maintain": {
        "badge": "Wöchentliche Beziehungspflege",
        "title": "Maintain-Modus",
        "duration": "~90 Minuten • 3 Runden × 15 min",
        "description": "Das klassische wöchentliche Zwiegespräch für laufende Beziehungspflege. Drei Runden mit 15-minütigen Sprechfenstern ermöglichen tiefe, ungehetzte Gespräche.",
        "recommendedFor": "Empfohlen für:",
        "useCase": "Paare, die regelmäßige, wöchentliche Beziehungs-Check-ins möchten. Ideal zur Aufrechterhaltung der Verbindung und zum Ansprechen von Problemen, bevor sie größer werden."
      },
      "commitment": {
        "badge": "Krisenunterstützung",
        "title": "Commitment-Modus",
        "duration": "~60 Minuten • 3 Runden × 10 min",
        "description": "Kürzere, häufigere Sitzungen für Paare in Krisen. Nutzen Sie 2-3 Mal pro Woche, um zu stabilisieren und Verbindung in schwierigen Zeiten wieder aufzubauen.",
        "recommendedFor": "Empfohlen für:",
        "useCase": "Paare, die vor Herausforderungen stehen und häufigere Berührungspunkte benötigen. Das kürzere Format macht es einfacher, sich auf 2-3 Sitzungen pro Woche einzulassen."
      },
      "listening": {
        "badge": "Einsteigerfreundlich",
        "title": "Listening-Modus",
        "duration": "~45 Minuten • 2 Runden × 10 min",
        "description": "Eine kürzere Einführung ins Zwiegespräch. Perfekt für Erstnutzer oder wenn Sie wenig Zeit haben. Enthält mehr Anleitung während der gesamten Session.",
        "recommendedFor": "Empfohlen für:",
        "useCase": "Paare, die neu beim Zwiegespräch sind oder volle Terminkalender haben. Die kürzere Dauer und zusätzliche Anleitung machen den Einstieg leicht."
      },
      "custom": {
        "badge": "Fortgeschrittene Option",
        "title": "Custom-Modus",
        "subtitle": "Eigene Sequenz erstellen",
        "description": "Sobald Sie mit den voreingestellten Modi vertraut sind, können Sie eigene Sequenzen erstellen, die auf Ihre spezifischen Bedürfnisse und Ihren Zeitplan zugeschnitten sind.",
        "feature1": "Dauer für jedes Sprechfenster wählen",
        "feature2": "Anzahl der Runden auswählen (1-5)",
        "feature3": "Eigene Sequenzen speichern und wiederverwenden",
        "tip": "Wir empfehlen, mit einem voreingestellten Modus zu beginnen, um sich mit dem Zwiegespräch vertraut zu machen, bevor Sie eigene Sequenzen erstellen."
      }
    },
    "readyToStart": {
      "title": "Bereit zu starten?",
      "subtitle": "Wählen Sie einen Modus, der zu Ihren Bedürfnissen und Ihrem Zeitplan passt. Sie können ihn später jederzeit ändern.",
      "custom": {
        "desc": "Eigene Sequenz erstellen (Fortgeschritten)"
      },
      "note": "Wählen Sie oben einen Modus aus und klicken Sie dann auf \"Session starten\", um Ihr erstes Zwiegespräch zu beginnen."
    }
  }
}
```

**Step 3: Run i18n parity test to verify keys match**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test i18n.parity`

Expected: PASS (ensures DE and EN have matching keys)

**Step 4: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add src/i18n/en/translation.json src/i18n/de/translation.json
git commit -m "feat(onboarding): add English and German translations"
```

---

## Task 11: Manual Testing and E2E Test

**Files:**
- Create: `e2e/onboarding.spec.ts`

**Step 1: Write E2E test**

Create `e2e/onboarding.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('complete onboarding journey and start session', async ({ page }) => {
    await page.goto('/')

    // Should show "Take the tour" button
    await expect(page.getByRole('button', { name: /take the tour/i })).toBeVisible()

    // Click to open onboarding
    await page.getByRole('button', { name: /take the tour/i }).click()

    // Slide 1: IntroSlide
    await expect(page.getByText(/Welcome to Couples Timer/i)).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Slide 2: MoellerMethodSlide
    await expect(page.getByText(/Moeller Method/i)).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Slide 3: AdaptationsSlide
    await expect(page.getByText(/Our Adaptations/i)).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Slide 4: MaintainModeSlide
    await expect(page.getByText(/Maintain Mode/i)).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Slide 5: CommitmentModeSlide
    await expect(page.getByText(/Commitment Mode/i)).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Slide 6: ListeningModeSlide
    await expect(page.getByText(/Listening Mode/i)).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Slide 7: CustomModeSlide
    await expect(page.getByText(/Custom Mode/i)).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Slide 8: ReadyToStartSlide
    await expect(page.getByText(/Ready to Start/i)).toBeVisible()

    // Select Listening mode
    const listeningCard = page.getByText(/Listening/i).first()
    await listeningCard.click()

    // Start Session button should be enabled
    const startButton = page.getByRole('button', { name: /start session/i })
    await expect(startButton).toBeEnabled()
    await startButton.click()

    // Should start session with Listening mode
    await expect(page.getByText(/Listening/i)).toBeVisible()
    await expect(page.getByText(/Preparation/i)).toBeVisible()
  })

  test('can skip onboarding', async ({ page }) => {
    await page.goto('/')

    // Open onboarding
    await page.getByRole('button', { name: /take the tour/i }).click()

    // Click skip
    await page.getByRole('button', { name: /skip/i }).click()

    // Should close modal and return to mode selection
    await expect(page.getByText(/Welcome to Couples Timer/i)).not.toBeVisible()
    await expect(page.getByText(/Couples Timer/i)).toBeVisible()
  })

  test('can navigate backward through slides', async ({ page }) => {
    await page.goto('/')

    // Open onboarding
    await page.getByRole('button', { name: /take the tour/i }).click()

    // Go forward 2 slides
    await page.getByRole('button', { name: /next/i }).click()
    await page.getByRole('button', { name: /next/i }).click()

    // Should be on AdaptationsSlide
    await expect(page.getByText(/Our Adaptations/i)).toBeVisible()

    // Go back one slide
    await page.getByRole('button', { name: /back/i }).click()

    // Should be on MoellerMethodSlide
    await expect(page.getByText(/Moeller Method/i)).toBeVisible()
  })

  test('progress dots indicate current slide', async ({ page }) => {
    await page.goto('/')

    // Open onboarding
    await page.getByRole('button', { name: /take the tour/i }).click()

    // Should have 8 progress dots
    const dots = page.locator('[data-testid^="progress-dot-"]')
    await expect(dots).toHaveCount(8)

    // First dot should be active (wider)
    const firstDot = page.locator('[data-testid="progress-dot-0"]')
    await expect(firstDot).toHaveClass(/w-8/)
  })

  test('language switch affects onboarding content', async ({ page }) => {
    await page.goto('/')

    // Open settings and switch to German
    await page.getByRole('button', { name: /settings/i }).click()
    await page.getByRole('button', { name: /Deutsch/i }).click()

    // Close settings
    await page.keyboard.press('Escape')

    // Open onboarding
    await page.getByRole('button', { name: /Tour starten/i }).click()

    // Should show German text
    await expect(page.getByText(/Willkommen beim Couples Timer/i)).toBeVisible()
  })
})
```

**Step 2: Run E2E test**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm run test:e2e`

Expected: PASS (5 tests)

**Step 3: Manual testing checklist**

Open the app in browser and verify:
- [ ] "Take the tour" button visible on mode selection
- [ ] Clicking opens modal with first slide
- [ ] All 8 slides render correctly
- [ ] Navigation (Next/Back) works
- [ ] Progress dots update
- [ ] Skip button closes modal
- [ ] Mode selection on final slide highlights card
- [ ] Start Session button enables when mode selected
- [ ] Completing onboarding starts session with selected mode
- [ ] Animations smooth (slide transitions, timeline blocks)
- [ ] Responsive on mobile (swipe gestures work)
- [ ] Dark mode looks good
- [ ] German translations correct

**Step 4: Commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add e2e/onboarding.spec.ts
git commit -m "test(onboarding): add E2E tests for complete user journey"
```

---

## Task 12: Final Build and Verification

**Step 1: Run full test suite**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm test`

Expected: All new tests PASS (existing guidance test failures are acceptable per baseline)

**Step 2: Run build to check for TypeScript errors**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm run build`

Expected: Build succeeds with no errors

**Step 3: Run linter**

Run: `cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey && npm run lint`

Expected: No linting errors (auto-fix if needed)

**Step 4: Final commit**

```bash
cd ~/.config/superpowers/worktrees/Couple_timer/feature/onboarding-user-journey
git add .
git commit -m "chore(onboarding): final verification and cleanup"
```

**Step 5: Verification summary**

Create summary of implementation:
- ✅ 8 slide components created
- ✅ PhaseTimeline reusable component
- ✅ OnboardingSlider with navigation
- ✅ OnboardingModal integration
- ✅ ModeSelectionView "Take the tour" button
- ✅ Complete i18n (EN/DE)
- ✅ Unit tests for all components
- ✅ E2E tests for user journey
- ✅ Build passes
- ✅ No TypeScript errors

---

## Summary

**Total Tasks:** 12
**Components Created:** 13 (PhaseTimeline, OnboardingSlider, 8 slides, OnboardingModal)
**Tests Created:** 30+ unit tests, 5 E2E tests
**Translations:** 100+ keys (EN + DE)
**Estimated Implementation Time:** 4-6 hours for experienced developer

**Key Architectural Decisions:**
1. Modal overlay (not routing) for simplicity
2. React + SVG for graphics (full control, animations)
3. Reusable PhaseTimeline component
4. TDD approach throughout
5. Complete i18n from day one
6. Smooth handoff to session start

**Testing Strategy:**
- Unit tests verify each component renders correctly
- Integration tests verify slide navigation
- E2E tests verify complete user journey
- i18n parity tests ensure translation completeness

**Success Criteria Met:**
✓ Educational content (Moeller method + adaptations)
✓ Visual mode breakdowns with timelines
✓ Optional access ("Take the tour")
✓ Smooth transition to first session
✓ Fully localized (DE/EN)
✓ Responsive design
✓ Comprehensive test coverage

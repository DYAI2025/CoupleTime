import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { PhaseTimeline } from '../PhaseTimeline'
import type { SlideProps } from '../OnboardingSlider'
import type { PhaseConfig } from '../../../domain/PhaseConfig'

interface ModeInfo {
  titleKey: string
  titleFallback: string
  descKey: string
  descFallback: string
  duration: string
  rounds: string
  frequency?: string
  phases: PhaseConfig[]
  totalDuration: number
  color: string
}

function ModeBreakdownSlide({ mode }: { mode: ModeInfo }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: mode.color }}
        >
          {t(mode.titleKey, mode.titleFallback)}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t(mode.descKey, mode.descFallback)}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto"
      >
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ~{mode.duration}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('onboarding.mode.minutes', 'minutes')}
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {mode.rounds}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('onboarding.mode.rounds', 'rounds')}
          </div>
        </div>
        {mode.frequency && (
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {mode.frequency}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('onboarding.mode.frequency', 'frequency')}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
          {t('onboarding.mode.timeline', 'Session Timeline')}
        </h3>
        <PhaseTimeline phases={mode.phases} totalDuration={mode.totalDuration} />
      </motion.div>
    </div>
  )
}

// Maintain mode phases (simplified for display - in minutes)
const maintainPhases: PhaseConfig[] = [
  { type: 'prep', durationMinutes: 2, speaker: null },
  { type: 'slotA', durationMinutes: 15, speaker: 'A' },
  { type: 'slotB', durationMinutes: 15, speaker: 'B' },
  { type: 'transition', durationMinutes: 1, speaker: null },
  { type: 'slotA', durationMinutes: 15, speaker: 'A' },
  { type: 'slotB', durationMinutes: 15, speaker: 'B' },
  { type: 'transition', durationMinutes: 1, speaker: null },
  { type: 'slotA', durationMinutes: 15, speaker: 'A' },
  { type: 'slotB', durationMinutes: 15, speaker: 'B' },
  { type: 'closingA', durationMinutes: 3, speaker: 'A' },
  { type: 'closingB', durationMinutes: 3, speaker: 'B' },
  { type: 'cooldown', durationMinutes: 10, speaker: null },
]

export function MaintainModeSlide(_props: SlideProps) {
  return (
    <ModeBreakdownSlide
      mode={{
        titleKey: 'onboarding.mode.maintain.title',
        titleFallback: 'Maintain Mode',
        descKey: 'onboarding.mode.maintain.desc',
        descFallback: 'Weekly relationship maintenance conversation - keep connection strong',
        duration: '90',
        rounds: '3 rounds',
        frequency: '1×/week',
        phases: maintainPhases,
        totalDuration: 110,
        color: '#10B981',
      }}
    />
  )
}

// Commitment mode phases (simplified for display - in minutes)
const commitmentPhases: PhaseConfig[] = [
  { type: 'prep', durationMinutes: 2, speaker: null },
  { type: 'slotA', durationMinutes: 10, speaker: 'A' },
  { type: 'slotB', durationMinutes: 10, speaker: 'B' },
  { type: 'transition', durationMinutes: 1, speaker: null },
  { type: 'slotA', durationMinutes: 10, speaker: 'A' },
  { type: 'slotB', durationMinutes: 10, speaker: 'B' },
  { type: 'transition', durationMinutes: 1, speaker: null },
  { type: 'slotA', durationMinutes: 10, speaker: 'A' },
  { type: 'slotB', durationMinutes: 10, speaker: 'B' },
  { type: 'closingA', durationMinutes: 2, speaker: 'A' },
  { type: 'closingB', durationMinutes: 2, speaker: 'B' },
  { type: 'cooldown', durationMinutes: 10, speaker: null },
]

export function CommitmentModeSlide(_props: SlideProps) {
  return (
    <ModeBreakdownSlide
      mode={{
        titleKey: 'onboarding.mode.commitment.title',
        titleFallback: 'Commitment Mode',
        descKey: 'onboarding.mode.commitment.desc',
        descFallback: 'Stabilization during crisis phases - more frequent, focused sessions',
        duration: '60',
        rounds: '3 rounds',
        frequency: '2×/week',
        phases: commitmentPhases,
        totalDuration: 78,
        color: '#F59E0B',
      }}
    />
  )
}

// Listening mode phases (simplified for display - in minutes)
const listeningPhases: PhaseConfig[] = [
  { type: 'prep', durationMinutes: 1.5, speaker: null },
  { type: 'slotA', durationMinutes: 10, speaker: 'A' },
  { type: 'slotB', durationMinutes: 10, speaker: 'B' },
  { type: 'transition', durationMinutes: 1.5, speaker: null },
  { type: 'slotA', durationMinutes: 10, speaker: 'A' },
  { type: 'slotB', durationMinutes: 10, speaker: 'B' },
  { type: 'closingA', durationMinutes: 2, speaker: 'A' },
  { type: 'closingB', durationMinutes: 2, speaker: 'B' },
  { type: 'cooldown', durationMinutes: 10, speaker: null },
]

export function ListeningModeSlide(_props: SlideProps) {
  return (
    <ModeBreakdownSlide
      mode={{
        titleKey: 'onboarding.mode.listening.title',
        titleFallback: 'Listening Mode',
        descKey: 'onboarding.mode.listening.desc',
        descFallback: 'Beginner-friendly mode with more guidance - perfect for starting out',
        duration: '45',
        rounds: '2 rounds',
        phases: listeningPhases,
        totalDuration: 57,
        color: '#8B5CF6',
      }}
    />
  )
}

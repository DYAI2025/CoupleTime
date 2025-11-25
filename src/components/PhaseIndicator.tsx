import { useSessionViewModel } from '../contexts/SessionContext'
import { PhaseType } from '../domain/PhaseType'
import { Speaker } from '../domain/Speaker'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface PhaseIndicatorProps {
  /** Override phase type (for testing/preview) */
  phaseType?: PhaseType | null
  /** Override speaker (for testing/preview) */
  speaker?: Speaker
  /** Show phase number */
  showPhaseNumber?: boolean
}

/**
 * Color classes for each phase type
 */
const PHASE_COLOR_CLASSES: Record<PhaseType, { bg: string; text: string; border: string }> = {
  [PhaseType.Prep]: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-600',
  },
  [PhaseType.SlotA]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  },
  [PhaseType.SlotB]: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-600',
  },
  [PhaseType.Transition]: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-600',
  },
  [PhaseType.ClosingA]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  },
  [PhaseType.ClosingB]: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-600',
  },
  [PhaseType.Cooldown]: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-600',
  },
}

/**
 * Speaker icons
 */
function SpeakerIcon({ speaker, className = '' }: { speaker: Speaker; className?: string }) {
  if (speaker === Speaker.None) return null

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {speaker === Speaker.A ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
        </svg>
      )}
    </span>
  )
}

/**
 * Shows current phase with visual indicator and speaker info
 */
export function PhaseIndicator({ phaseType, speaker, showPhaseNumber = true }: PhaseIndicatorProps) {
  const { t } = useTranslation()
  const viewModel = useSessionViewModel()

  const currentPhase = phaseType ?? viewModel.phaseType
  const currentSpeaker = speaker ?? viewModel.speaker
  const phaseIndex = viewModel.currentPhaseIndex
  const totalPhases = viewModel.totalPhases

  if (!currentPhase) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        {t('session.selectMode', 'Select a mode to begin')}
      </div>
    )
  }

  const colors = PHASE_COLOR_CLASSES[currentPhase]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPhase + phaseIndex}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`
          flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2
          ${colors.bg} ${colors.border}
        `}
      >
        {/* Phase name with speaker icon */}
        <div className={`flex items-center gap-2 text-xl font-semibold ${colors.text}`}>
          <SpeakerIcon speaker={currentSpeaker} />
          <span>{t(`phases.${currentPhase}`, viewModel.phaseDisplayName)}</span>
        </div>

        {/* Speaker name for speaking phases */}
        {currentSpeaker !== Speaker.None && (
          <div className={`text-sm font-medium ${colors.text} opacity-80`}>
            {t(`speaker.${currentSpeaker}`, viewModel.speakerDisplayName)}
          </div>
        )}

        {/* Phase number */}
        {showPhaseNumber && totalPhases > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('session.phaseOf', 'Phase {{current}} of {{total}}', {
              current: phaseIndex + 1,
              total: totalPhases,
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Compact phase indicator for header/footer
 */
export function PhaseIndicatorCompact() {
  const { t } = useTranslation()
  const viewModel = useSessionViewModel()

  if (!viewModel.phaseType) return null

  const colors = PHASE_COLOR_CLASSES[viewModel.phaseType]

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
        ${colors.bg} ${colors.text}
      `}
    >
      <SpeakerIcon speaker={viewModel.speaker} className="w-4 h-4" />
      <span>{t(`phases.${viewModel.phaseType}`, viewModel.phaseDisplayName)}</span>
    </div>
  )
}

/**
 * Standalone phase indicator without context dependency
 */
export function PhaseIndicatorStandalone({
  phaseType,
  speaker,
  phaseName,
  speakerName,
}: {
  phaseType: PhaseType
  speaker: Speaker
  phaseName: string
  speakerName?: string
}) {
  const colors = PHASE_COLOR_CLASSES[phaseType]

  return (
    <div
      className={`
        flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2
        ${colors.bg} ${colors.border}
      `}
    >
      <div className={`flex items-center gap-2 text-xl font-semibold ${colors.text}`}>
        <SpeakerIcon speaker={speaker} />
        <span>{phaseName}</span>
      </div>

      {speakerName && (
        <div className={`text-sm font-medium ${colors.text} opacity-80`}>
          {speakerName}
        </div>
      )}
    </div>
  )
}

export default PhaseIndicator

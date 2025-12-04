import { useSessionViewModel, useSession } from '../contexts/SessionContext'
import type { SessionMode } from '../domain/SessionMode'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

/**
 * Play icon
 */
function PlayIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Pause icon
 */
function PauseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Stop icon
 */
function StopIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
        clipRule="evenodd"
      />
    </svg>
  )
}

interface ControlButtonsProps {
  /** Mode to start when clicking play (required when idle) */
  selectedMode?: SessionMode | null
  /** Callback when mode selection is needed */
  onSelectMode?: () => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Layout direction */
  direction?: 'horizontal' | 'vertical'
}

/**
 * Session control buttons (Play/Pause/Resume/Stop)
 */
export function ControlButtons({
  selectedMode,
  onSelectMode,
  size = 'lg',
  direction = 'horizontal',
}: ControlButtonsProps) {
  const { t } = useTranslation()
  const viewModel = useSessionViewModel()
  const session = useSession()

  const handlePlayPause = async () => {
    if (viewModel.canStart) {
      if (selectedMode) {
        await session.start(selectedMode, session.participantConfig)
      } else if (onSelectMode) {
        onSelectMode()
      }
    } else if (viewModel.canPause) {
      session.pause()
    } else if (viewModel.canResume) {
      session.resume()
    }
  }

  const handleStop = () => {
    if (viewModel.canStop) {
      session.stop()
    }
  }

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const containerClasses = direction === 'horizontal'
    ? 'flex items-center gap-4'
    : 'flex flex-col items-center gap-3'

  return (
    <div className={containerClasses}>
      {/* Play/Pause/Resume button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePlayPause}
        disabled={viewModel.isFinished && !selectedMode}
        className={`
          ${sizeClasses[size]}
          rounded-full
          ${viewModel.canStart || viewModel.canResume
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : viewModel.canPause
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          transition-colors shadow-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={
          viewModel.canStart
            ? t('controls.start', 'Start')
            : viewModel.canPause
            ? t('controls.pause', 'Pause')
            : viewModel.canResume
            ? t('controls.resume', 'Resume')
            : t('controls.start', 'Start')
        }
      >
        {viewModel.canPause ? (
          <PauseIcon className={iconSizes[size]} />
        ) : (
          <PlayIcon className={iconSizes[size]} />
        )}
      </motion.button>

      {/* Stop button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStop}
        disabled={!viewModel.canStop}
        className={`
          ${sizeClasses[size]}
          rounded-full
          ${viewModel.canStop
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }
          transition-colors shadow-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={t('controls.stop', 'Stop')}
      >
        <StopIcon className={iconSizes[size]} />
      </motion.button>
    </div>
  )
}

/**
 * Minimal control buttons for compact layouts
 */
export function ControlButtonsMinimal() {
  const { t } = useTranslation()
  const viewModel = useSessionViewModel()
  const session = useSession()

  if (viewModel.isIdle || viewModel.isFinished) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={viewModel.canPause ? session.pause : session.resume}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={viewModel.canPause ? t('controls.pause', 'Pause') : t('controls.resume', 'Resume')}
      >
        {viewModel.canPause ? (
          <PauseIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <PlayIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>
      <button
        onClick={session.stop}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('controls.stop', 'Stop')}
      >
        <StopIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  )
}

/**
 * Start button for mode selection screen
 */
export function StartButton({
  mode,
  disabled = false,
  fullWidth = false,
}: {
  mode: SessionMode
  disabled?: boolean
  fullWidth?: boolean
}) {
  const { t } = useTranslation()
  const session = useSession()

  const handleStart = async () => {
    await session.start(mode, session.participantConfig)
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleStart}
      disabled={disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        px-8 py-4 rounded-xl
        bg-green-500 hover:bg-green-600
        text-white font-semibold text-lg
        transition-colors shadow-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500
      `}
    >
      <span className="flex items-center justify-center gap-2">
        <PlayIcon className="w-6 h-6" />
        {t('controls.startSession', 'Start Session')}
      </span>
    </motion.button>
  )
}

export default ControlButtons

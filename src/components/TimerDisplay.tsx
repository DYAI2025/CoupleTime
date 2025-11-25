import { useSessionViewModel } from '../contexts/SessionContext'
import { motion, AnimatePresence } from 'framer-motion'

interface TimerDisplayProps {
  /** Override the time to display (for testing/preview) */
  time?: string
  /** Show pulse animation when running */
  showPulse?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Large countdown timer display
 * Shows remaining time in MM:SS or H:MM:SS format
 */
export function TimerDisplay({ time, showPulse = true, size = 'lg' }: TimerDisplayProps) {
  const viewModel = useSessionViewModel()

  const displayTime = time ?? viewModel.remainingTimeFormatted
  const isRunning = viewModel.isRunning
  const isPaused = viewModel.isPaused

  const sizeClasses = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl md:text-9xl',
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayTime}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{ opacity: 0.8, scale: 0.98 }}
          transition={{ duration: 0.1 }}
          className={`
            font-mono font-bold tracking-tight
            ${sizeClasses[size]}
            ${isPaused ? 'text-gray-400' : 'text-gray-900 dark:text-white'}
            ${isRunning && showPulse ? 'animate-pulse-subtle' : ''}
          `}
          role="timer"
          aria-label={`Remaining time: ${displayTime}`}
        >
          {displayTime}
        </motion.div>
      </AnimatePresence>

      {isPaused && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400"
        >
          PAUSED
        </motion.div>
      )}
    </div>
  )
}

/**
 * Standalone timer display without context dependency
 */
export function TimerDisplayStandalone({
  time,
  isPaused = false,
  size = 'lg',
}: {
  time: string
  isPaused?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl md:text-9xl',
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`
          font-mono font-bold tracking-tight
          ${sizeClasses[size]}
          ${isPaused ? 'text-gray-400' : 'text-gray-900 dark:text-white'}
        `}
        role="timer"
        aria-label={`Time: ${time}`}
      >
        {time}
      </div>

      {isPaused && (
        <div className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
          PAUSED
        </div>
      )}
    </div>
  )
}

export default TimerDisplay

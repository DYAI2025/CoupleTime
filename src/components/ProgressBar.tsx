import { useSessionViewModel } from '../contexts/SessionContext'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  /** Progress value 0-100 */
  progress?: number
  /** Color variant */
  variant?: 'primary' | 'phase' | 'neutral'
  /** Show percentage label */
  showLabel?: boolean
  /** Height variant */
  height?: 'sm' | 'md' | 'lg'
  /** Animate transitions */
  animated?: boolean
}

/**
 * Linear progress bar for phase or session progress
 */
export function ProgressBar({
  progress,
  variant = 'primary',
  showLabel = false,
  height = 'md',
  animated = true,
}: ProgressBarProps) {
  const viewModel = useSessionViewModel()
  const value = progress ?? viewModel.phaseProgressPercent

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const variantClasses = {
    primary: 'bg-blue-500 dark:bg-blue-400',
    phase: getPhaseProgressColor(viewModel.phaseColor),
    neutral: 'bg-gray-500 dark:bg-gray-400',
  }

  return (
    <div className="w-full">
      <div
        className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${heightClasses[height]}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {animated ? (
          <motion.div
            className={`h-full rounded-full ${variantClasses[variant]}`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        ) : (
          <div
            className={`h-full rounded-full ${variantClasses[variant]}`}
            style={{ width: `${value}%` }}
          />
        )}
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          {value}%
        </div>
      )}
    </div>
  )
}

/**
 * Circular progress indicator
 */
export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  showValue = true,
}: {
  progress?: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
}) {
  const viewModel = useSessionViewModel()
  const value = progress ?? viewModel.phaseProgressPercent

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-gray-200 dark:stroke-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-blue-500 dark:stroke-blue-400"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            {value}%
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Session progress showing all phases as segments
 */
export function SessionProgressBar() {
  const viewModel = useSessionViewModel()

  if (viewModel.totalPhases === 0) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {Array.from({ length: viewModel.totalPhases }).map((_, index) => {
          const isCompleted = index < viewModel.currentPhaseIndex
          const isCurrent = index === viewModel.currentPhaseIndex
          const progress = isCurrent ? viewModel.phaseProgressPercent : isCompleted ? 100 : 0

          return (
            <div
              key={index}
              className="flex-1 bg-gray-200 dark:bg-gray-700 first:rounded-l-full last:rounded-r-full overflow-hidden"
            >
              <motion.div
                className={`h-full ${
                  isCompleted || isCurrent
                    ? 'bg-blue-500 dark:bg-blue-400'
                    : 'bg-transparent'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Phase {viewModel.currentPhaseIndex + 1}/{viewModel.totalPhases}</span>
        <span>{viewModel.sessionProgressPercent}% complete</span>
      </div>
    </div>
  )
}

/**
 * Standalone progress bar without context
 */
export function ProgressBarStandalone({
  progress,
  color = 'blue',
  height = 'md',
}: {
  progress: number
  color?: string
  height?: 'sm' | 'md' | 'lg'
}) {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div
      className={`
        w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
        ${heightClasses[height]}
      `}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full bg-${color}-500`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/**
 * Get Tailwind color class for phase progress
 */
function getPhaseProgressColor(phaseColor: string): string {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-500 dark:bg-slate-400',
    blue: 'bg-blue-500 dark:bg-blue-400',
    rose: 'bg-rose-500 dark:bg-rose-400',
    amber: 'bg-amber-500 dark:bg-amber-400',
    emerald: 'bg-emerald-500 dark:bg-emerald-400',
    gray: 'bg-gray-500 dark:bg-gray-400',
  }
  return colorMap[phaseColor] ?? colorMap.gray
}

export default ProgressBar

import { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface TipDisplayProps {
  /** Auto-rotate tips every N seconds (0 to disable) */
  rotateInterval?: number
  /** Show navigation arrows */
  showNavigation?: boolean
  /** Compact single-line display */
  compact?: boolean
}

/**
 * Displays guidance tips for the current phase
 */
export function TipDisplay({
  rotateInterval = 10,
  showNavigation = true,
  compact = false,
}: TipDisplayProps) {
  const { t } = useTranslation()
  const { tips, viewModel } = useSession()
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Auto-rotate tips
  useEffect(() => {
    if (rotateInterval <= 0 || tips.length <= 1) return

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length)
    }, rotateInterval * 1000)

    return () => clearInterval(interval)
  }, [rotateInterval, tips.length])

  // Reset index when tips change
  useEffect(() => {
    setCurrentTipIndex(0)
  }, [viewModel.currentPhaseIndex])

  // No tips to show
  if (tips.length === 0) {
    return null
  }

  const currentTip = tips[currentTipIndex]

  const goToPrevious = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length)
  }

  const goToNext = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <LightbulbIcon className="w-4 h-4 flex-shrink-0 text-amber-500" />
        <span className="truncate">{t(currentTip, currentTip)}</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <LightbulbIcon className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-amber-800 dark:text-amber-200"
              >
                {t(currentTip, currentTip)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        {showNavigation && tips.length > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={goToPrevious}
              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
              aria-label={t('tips.previous', 'Previous tip')}
            >
              <ChevronLeftIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>

            <div className="flex gap-1">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTipIndex(index)}
                  className={`
                    w-2 h-2 rounded-full transition-colors
                    ${index === currentTipIndex
                      ? 'bg-amber-500'
                      : 'bg-amber-300 dark:bg-amber-700 hover:bg-amber-400 dark:hover:bg-amber-600'
                    }
                  `}
                  aria-label={t('tips.goToTip', 'Go to tip {{number}}', { number: index + 1 })}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
              aria-label={t('tips.next', 'Next tip')}
            >
              <ChevronRightIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Single random tip display
 */
export function RandomTipDisplay() {
  const { t } = useTranslation()
  const { randomTip } = useSession()

  if (!randomTip) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
      <LightbulbIcon className="w-4 h-4 flex-shrink-0 text-amber-500" />
      <span className="text-sm text-amber-800 dark:text-amber-200">
        {t(randomTip, randomTip)}
      </span>
    </div>
  )
}

/**
 * Tip overlay for full-screen display during transitions
 */
export function TipOverlay({
  tip,
  onDismiss,
}: {
  tip: string
  onDismiss?: () => void
}) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-md mx-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <LightbulbIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t('tips.title', 'Tip')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t(tip, tip)}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {t('common.dismiss', 'Dismiss')}
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

// Icons
function LightbulbIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function ChevronLeftIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default TipDisplay

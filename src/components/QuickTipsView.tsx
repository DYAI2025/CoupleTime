import { motion, AnimatePresence } from 'framer-motion'
import { useTipRotation } from '../hooks/useTipRotation'

export interface QuickTipsViewProps {
  /** Array of tips to display */
  tips: string[]
  /** Enable auto-rotation */
  autoRotate: boolean
  /** Seconds between rotations */
  interval: number
  /** Use shuffle mode (show each once before repeat) */
  shuffleMode: boolean
}

/**
 * Displays shuffled quick tips with manual navigation controls
 */
export function QuickTipsView({
  tips,
  autoRotate,
  interval,
  shuffleMode,
}: QuickTipsViewProps) {
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Tip Content */}
        <div className="min-h-[80px] flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <p className="text-lg text-gray-800 dark:text-gray-200">
                {current}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={previous}
            disabled={isFirst}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700 transition-colors"
            aria-label="Previous tip"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Previous</span>
          </button>

          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {total}
          </div>

          <button
            onClick={next}
            disabled={isLast}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700 transition-colors"
            aria-label="Next tip"
          >
            <span className="text-sm font-medium">Next</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Icons
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

import { useSession } from '../contexts/SessionContext'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface QuickTipsViewProps {
  showAllTips?: boolean
  tips?: string[]
}

/**
 * Quick tips view with navigation and rotating tips
 */
export function QuickTipsView({
  showAllTips = false,
  tips,
}: QuickTipsViewProps) {
  const { t } = useTranslation()
  const { tips: sessionTips, randomTip } = useSession()
  const availableTips = tips ?? sessionTips ?? []
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Filter tips based on showAllTips setting
  const displayTips = showAllTips
    ? availableTips
    : [randomTip ?? availableTips[0]].filter(Boolean) as string[]

  if (displayTips.length === 0) {
    return null
  }

  const goToPrevious = () => {
    setCurrentTipIndex((prev) => (prev - 1 + displayTips.length) % displayTips.length)
  }

  const goToNext = () => {
    setCurrentTipIndex((prev) => (prev + 1) % displayTips.length)
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
                {t(displayTips[currentTipIndex], displayTips[currentTipIndex])}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        {displayTips.length > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={goToPrevious}
              className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
              aria-label={t('tips.previous', 'Previous tip')}
            >
              <ChevronLeftIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>

            <div className="flex gap-1">
              {displayTips.map((_, index) => (
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

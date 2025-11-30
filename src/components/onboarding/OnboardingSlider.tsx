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

import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { OnboardingSlider } from './OnboardingSlider'
import { IntroSlide } from './slides/IntroSlide'
import { MoellerMethodSlide } from './slides/MoellerMethodSlide'
import { AdaptationsSlide } from './slides/AdaptationsSlide'
import {
  MaintainModeSlide,
  CommitmentModeSlide,
  ListeningModeSlide,
} from './slides/ModeBreakdownSlide'
import { CustomModeSlide } from './slides/CustomModeSlide'
import { ReadyToStartSlide } from './slides/ReadyToStartSlide'
import type { SessionMode } from '../../domain/SessionMode'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (selectedMode?: SessionMode) => void
}

const slides = [
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

  const handleComplete = (selectedMode?: SessionMode) => {
    onComplete(selectedMode)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-testid="onboarding-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-3xl h-[90vh] max-h-[700px] mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Skip/Close button */}
            <motion.button
              onClick={onClose}
              aria-label={t('onboarding.skip', 'Skip tour')}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Slider content */}
            <OnboardingSlider slides={slides} onComplete={handleComplete} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

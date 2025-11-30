import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { SlideProps } from '../OnboardingSlider'

function HeartTimerIcon() {
  return (
    <svg
      data-testid="heart-timer-icon"
      className="w-24 h-24 mx-auto mb-8"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Heart shape */}
      <path
        d="M50 85C50 85 15 65 15 40C15 25 25 15 35 15C42 15 47 18 50 23C53 18 58 15 65 15C75 15 85 25 85 40C85 65 50 85 50 85Z"
        fill="#EF4444"
        stroke="#DC2626"
        strokeWidth="2"
      />
      {/* Clock hands */}
      <line
        x1="50"
        y1="45"
        x2="50"
        y2="30"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="45"
        x2="60"
        y2="45"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="50" cy="45" r="3" fill="white" />
    </svg>
  )
}

export function IntroSlide(_props: SlideProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <HeartTimerIcon />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center"
      >
        {t('onboarding.intro.title', 'Welcome to Couples Timer')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-gray-600 dark:text-gray-400 mb-6 text-center"
      >
        {t(
          'onboarding.intro.subtitle',
          'Your guide to structured partner conversations'
        )}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-base text-gray-700 dark:text-gray-300 text-center max-w-2xl leading-relaxed"
      >
        {t(
          'onboarding.intro.description',
          'This tool helps you practice the Zwiegespräch method - a structured conversation technique that creates space for deep connection and understanding between partners.'
        )}
      </motion.p>
    </div>
  )
}

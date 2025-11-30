import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { SlideProps } from '../OnboardingSlider'

function CustomModeIcon() {
  return (
    <svg
      data-testid="custom-mode-icon"
      className="w-20 h-20 mx-auto mb-6"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gear/Settings icon */}
      <circle cx="40" cy="40" r="30" stroke="#6366F1" strokeWidth="3" fill="none" />
      <circle cx="40" cy="40" r="15" fill="#6366F1" />
      {/* Gear teeth */}
      <rect x="37" y="5" width="6" height="12" rx="2" fill="#6366F1" />
      <rect x="37" y="63" width="6" height="12" rx="2" fill="#6366F1" />
      <rect x="5" y="37" width="12" height="6" rx="2" fill="#6366F1" />
      <rect x="63" y="37" width="12" height="6" rx="2" fill="#6366F1" />
      {/* Diagonal teeth */}
      <rect x="12" y="12" width="6" height="12" rx="2" fill="#6366F1" transform="rotate(45 15 18)" />
      <rect x="62" y="12" width="6" height="12" rx="2" fill="#6366F1" transform="rotate(-45 65 18)" />
      <rect x="12" y="56" width="6" height="12" rx="2" fill="#6366F1" transform="rotate(-45 15 62)" />
      <rect x="62" y="56" width="6" height="12" rx="2" fill="#6366F1" transform="rotate(45 65 62)" />
      {/* Center dot */}
      <circle cx="40" cy="40" r="5" fill="white" />
    </svg>
  )
}

const customFeatures = [
  {
    icon: '⏱️',
    titleKey: 'onboarding.custom.feature1.title',
    titleFallback: 'Adjust phase durations',
    descKey: 'onboarding.custom.feature1.desc',
    descFallback: 'Set exactly how long each speaking turn and transition lasts.',
  },
  {
    icon: '🔄',
    titleKey: 'onboarding.custom.feature2.title',
    titleFallback: 'Choose number of rounds',
    descKey: 'onboarding.custom.feature2.desc',
    descFallback: 'Add or remove rounds to match your available time.',
  },
  {
    icon: '💾',
    titleKey: 'onboarding.custom.feature3.title',
    titleFallback: 'Save your configuration',
    descKey: 'onboarding.custom.feature3.desc',
    descFallback: 'Create and save multiple custom modes for different situations.',
  },
]

export function CustomModeSlide(_props: SlideProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CustomModeIcon />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 text-center"
      >
        {t('onboarding.custom.title', 'Custom Mode')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-base text-gray-700 dark:text-gray-300 text-center mb-6 max-w-2xl mx-auto"
      >
        {t(
          'onboarding.custom.description',
          'For advanced users who want full control over their conversation structure. Once you\'re familiar with the method, create your own perfect session.'
        )}
      </motion.p>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 max-w-xl mx-auto"
      >
        {customFeatures.map((feature, index) => (
          <motion.li
            key={feature.titleKey}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
          >
            <span className="text-2xl" role="img" aria-hidden="true">
              {feature.icon}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t(feature.titleKey, feature.titleFallback)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(feature.descKey, feature.descFallback)}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6"
      >
        {t(
          'onboarding.custom.tip',
          'Tip: Start with a preset mode to learn the rhythm before customizing.'
        )}
      </motion.p>
    </div>
  )
}

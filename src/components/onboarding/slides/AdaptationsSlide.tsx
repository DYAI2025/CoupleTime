import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { SlideProps } from '../OnboardingSlider'

function TransitionDiagram() {
  return (
    <svg
      data-testid="transition-diagram"
      className="w-full max-w-lg h-24 mx-auto"
      viewBox="0 0 480 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Partner A speaking */}
      <rect x="10" y="15" width="100" height="50" rx="6" fill="#10B981" />
      <text x="60" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
        A speaks
      </text>

      {/* Arrow to transition */}
      <path d="M120 40 L135 40" stroke="#6B7280" strokeWidth="2" />

      {/* Silent transition (highlighted) */}
      <rect x="145" y="10" width="80" height="60" rx="6" fill="#8B5CF6" />
      <text x="185" y="35" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
        1 min
      </text>
      <text x="185" y="50" textAnchor="middle" fill="white" fontSize="10">
        silence
      </text>
      {/* Bowl icon */}
      <circle cx="185" cy="62" r="4" fill="white" opacity="0.7" />

      {/* Arrow to B */}
      <path d="M235 40 L250 40" stroke="#6B7280" strokeWidth="2" />

      {/* Partner B speaking */}
      <rect x="260" y="15" width="100" height="50" rx="6" fill="#F59E0B" />
      <text x="310" y="45" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
        B speaks
      </text>

      {/* Arrow to transition */}
      <path d="M370 40 L385 40" stroke="#6B7280" strokeWidth="2" />

      {/* Second transition */}
      <rect x="395" y="15" width="70" height="50" rx="6" fill="#8B5CF6" opacity="0.7" />
      <text x="430" y="45" textAnchor="middle" fill="white" fontSize="10">
        1 min...
      </text>
    </svg>
  )
}

const adaptations = [
  {
    icon: '🧘',
    titleKey: 'onboarding.adaptations.transition.title',
    titleFallback: '1-minute silent transition',
    descKey: 'onboarding.adaptations.transition.desc',
    descFallback: 'After each speaking turn, a moment of silence helps process what was shared and prepare for what comes next.',
  },
  {
    icon: '💜',
    titleKey: 'onboarding.adaptations.regulation.title',
    titleFallback: 'Emotional regulation',
    descKey: 'onboarding.adaptations.regulation.desc',
    descFallback: 'The pause prevents reactive responses and gives space for emotions to settle naturally.',
  },
  {
    icon: '🔔',
    titleKey: 'onboarding.adaptations.audio.title',
    titleFallback: 'Gentle singing bowl cues',
    descKey: 'onboarding.adaptations.audio.desc',
    descFallback: 'Subtle audio signals mark phase transitions, so you can stay present without watching the clock.',
  },
]

export function AdaptationsSlide(_props: SlideProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center"
      >
        {t('onboarding.adaptations.title', 'Our Adaptations')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-base text-gray-700 dark:text-gray-300 text-center mb-6 max-w-2xl mx-auto"
      >
        {t(
          'onboarding.adaptations.description',
          'We\'ve enhanced the classic method with features designed to deepen the experience and support emotional connection.'
        )}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <TransitionDiagram />
      </motion.div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 max-w-xl mx-auto"
      >
        {adaptations.map((adaptation, index) => (
          <motion.li
            key={adaptation.titleKey}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <span className="text-2xl" role="img" aria-hidden="true">
              {adaptation.icon}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t(adaptation.titleKey, adaptation.titleFallback)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(adaptation.descKey, adaptation.descFallback)}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}

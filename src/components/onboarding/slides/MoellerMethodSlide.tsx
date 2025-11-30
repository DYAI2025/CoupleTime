import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { SlideProps } from '../OnboardingSlider'

function ConversationDiagram() {
  return (
    <svg
      data-testid="conversation-diagram"
      className="w-full max-w-md h-32 mx-auto"
      viewBox="0 0 400 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Partner A speaking block */}
      <rect x="10" y="20" width="120" height="60" rx="8" fill="#10B981" />
      <text x="70" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        Partner A
      </text>

      {/* Arrow */}
      <path d="M140 50 L160 50 M155 45 L160 50 L155 55" stroke="#6B7280" strokeWidth="2" />

      {/* Partner B listening block */}
      <rect x="170" y="20" width="60" height="60" rx="8" fill="#E5E7EB" stroke="#10B981" strokeWidth="2" strokeDasharray="4" />
      <text x="200" y="55" textAnchor="middle" fill="#6B7280" fontSize="12">
        listens
      </text>

      {/* Arrow */}
      <path d="M240 50 L260 50 M255 45 L260 50 L255 55" stroke="#6B7280" strokeWidth="2" />

      {/* Partner B speaking block */}
      <rect x="270" y="20" width="120" height="60" rx="8" fill="#F59E0B" />
      <text x="330" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        Partner B
      </text>
    </svg>
  )
}

const principles = [
  {
    icon: '⏱️',
    titleKey: 'onboarding.moeller.principle1.title',
    titleFallback: 'Equal speaking time',
    descKey: 'onboarding.moeller.principle1.desc',
    descFallback: 'Each partner gets the same amount of uninterrupted time to express themselves.',
  },
  {
    icon: '🤫',
    titleKey: 'onboarding.moeller.principle2.title',
    titleFallback: 'No interruptions',
    descKey: 'onboarding.moeller.principle2.desc',
    descFallback: 'The listening partner remains silent, giving full attention without responding.',
  },
  {
    icon: '👂',
    titleKey: 'onboarding.moeller.principle3.title',
    titleFallback: 'Active listening',
    descKey: 'onboarding.moeller.principle3.desc',
    descFallback: 'Focus entirely on understanding, not on formulating your response.',
  },
]

export function MoellerMethodSlide(_props: SlideProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center"
      >
        {t('onboarding.moeller.title', 'The Zwiegespräch Method')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-base text-gray-700 dark:text-gray-300 text-center mb-6 max-w-2xl mx-auto"
      >
        {t(
          'onboarding.moeller.description',
          'Developed by psychologist Michael Lukas Moeller, the Zwiegespräch is a structured dialogue method that has helped thousands of couples deepen their connection through regular, intentional conversations.'
        )}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <ConversationDiagram />
      </motion.div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 max-w-xl mx-auto"
      >
        {principles.map((principle, index) => (
          <motion.li
            key={principle.titleKey}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <span className="text-2xl" role="img" aria-hidden="true">
              {principle.icon}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t(principle.titleKey, principle.titleFallback)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(principle.descKey, principle.descFallback)}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}

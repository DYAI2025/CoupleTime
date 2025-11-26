import { useSession } from '../contexts/SessionContext'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface DeepDiveViewProps {
  showAllTips?: boolean
}

/**
 * Deep Dive view showing all tips in card format
 */
export function DeepDiveView({ showAllTips = false }: DeepDiveViewProps) {
  const { t } = useTranslation()
  const { tips, randomTip } = useSession()

  // Filter tips based on showAllTips setting
  const displayTips = showAllTips ? tips : [randomTip].filter(Boolean) as string[]

  if (displayTips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          {t('tips.noTipsAvailable', 'No tips available for this phase')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
      {displayTips.map((tip, index) => (
        <motion.div
          key={`${tip}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
          role="region"
          aria-labelledby={`tip-card-${index}`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <LightbulbIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 id={`tip-card-${index}`} className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                {t('tips.tip', 'Tip')} {index + 1}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t(tip, tip)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Icons
function LightbulbIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

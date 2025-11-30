import { useState } from 'react'
import { useSession } from '../contexts/SessionContext'
import { QuickTipsView } from './QuickTipsView'
import { DeepDiveView } from './DeepDiveView'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { GuidanceSettings } from '../domain/GuidanceSettings'

interface GuidancePanelProps {
  settings?: GuidanceSettings
  onSettingsChange?: (partial: Partial<GuidanceSettings>) => void
  currentPhaseTips?: string[]
  showAllTips?: boolean
  guidanceMode?: 'quick' | 'deep-dive'
}

/**
 * Guidance panel with mode toggle and content display
 */
export function GuidancePanel({
  settings,
  onSettingsChange,
  currentPhaseTips = [],
  showAllTips,
  guidanceMode,
}: GuidancePanelProps) {
  const { t } = useTranslation()
  const { viewModel } = useSession()
  const resolvedShowAllTips = showAllTips ?? settings?.showAllTips ?? false
  const initialMode = guidanceMode ?? settings?.guidanceMode ?? 'quick'
  const [currentMode, setCurrentMode] = useState<'quick' | 'deep-dive'>(initialMode)

  // Don't show if no guidance is available for this phase
  if (!viewModel.showGuidanceTips) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-700 rounded-lg" role="tablist">
          <button
            onClick={() => {
              setCurrentMode('quick')
              onSettingsChange?.({ guidanceMode: 'quick' })
            }}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${currentMode === 'quick'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }
            `}
            role="tab"
            aria-selected={currentMode === 'quick'}
            aria-controls="quick-tips-content"
          >
            {t('guidance.quickTips', 'Quick Tips')}
          </button>
          <button
            onClick={() => {
              setCurrentMode('deep-dive')
              onSettingsChange?.({ guidanceMode: 'deep-dive' })
            }}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${currentMode === 'deep-dive'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }
            `}
            role="tab"
            aria-selected={currentMode === 'deep-dive'}
            aria-controls="deep-dive-content"
          >
            {t('guidance.deepDive', 'Deep Dive')}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div 
        id={currentMode === 'quick' ? 'quick-tips-content' : 'deep-dive-content'} 
        role="tabpanel"
        aria-labelledby={currentMode === 'quick' ? 'quick-tips-tab' : 'deep-dive-tab'}
      >
        {currentMode === 'quick' ? (
          <QuickTipsView
            showAllTips={resolvedShowAllTips}
            tips={currentPhaseTips.length ? currentPhaseTips : undefined}
          />
        ) : (
          <DeepDiveView
            showAllTips={resolvedShowAllTips}
            tips={currentPhaseTips.length ? currentPhaseTips : undefined}
          />
        )}
      </div>
    </motion.div>
  )
}

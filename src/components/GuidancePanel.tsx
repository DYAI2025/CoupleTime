import { useTranslation } from 'react-i18next'
import type { GuidanceSettings } from '../domain/GuidanceSettings'
import { QuickTipsView } from './QuickTipsView'
import { DeepDiveView } from './DeepDiveView'

export interface GuidancePanelProps {
  settings: GuidanceSettings
  onSettingsChange: (partial: Partial<GuidanceSettings>) => void
  currentPhaseTips: string[]
}

export function GuidancePanel({ settings, onSettingsChange, currentPhaseTips }: GuidancePanelProps) {
  const { t } = useTranslation()

  const isQuick = settings.guidanceMode === 'quick'

  const activeClass = 'bg-indigo-600 text-white'
  const inactiveClass = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 h-[360px] border-t border-gray-200 dark:border-gray-700 flex flex-col z-20">
      {/* Mode toggle header */}
      <div className="flex gap-2 px-4 pt-3 pb-2 flex-shrink-0">
        <button
          aria-label="Quick Tips"
          onClick={() => onSettingsChange({ guidanceMode: 'quick' })}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${isQuick ? activeClass : inactiveClass}`}
        >
          {t('guidancePanel.quickTips', 'Quick Tips')}
        </button>
        <button
          aria-label="Deep Dive"
          onClick={() => onSettingsChange({ guidanceMode: 'deep-dive' })}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${!isQuick ? activeClass : inactiveClass}`}
        >
          {t('guidancePanel.deepDive', 'Deep Dive')}
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {isQuick ? (
          <QuickTipsView
            tips={currentPhaseTips}
            autoRotate={settings.showAllTips}
            interval={settings.autoRotateInterval}
            shuffleMode={settings.showAllTips}
          />
        ) : (
          <DeepDiveView
            tips={currentPhaseTips}
            showAllTips={settings.showAllTips}
          />
        )}
      </div>
    </div>
  )
}

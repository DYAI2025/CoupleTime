import { motion, AnimatePresence } from 'framer-motion'
import { QuickTipsView } from './QuickTipsView'
import { DeepDiveView } from './DeepDiveView'
import { GuidanceSettings, GuidanceMode } from '../domain/GuidanceSettings'

export interface GuidancePanelProps {
  /** Settings from persistence */
  settings: GuidanceSettings

  /** Callback when settings change (for persistence) */
  onSettingsChange: (settings: Partial<GuidanceSettings>) => void

  /** Current session data */
  currentPhaseTips?: string[]
}

/**
 * Main guidance panel that orchestrates QuickTipsView and DeepDiveView
 * with mode switching between them.
 *
 * Displays at bottom of screen with 360px height, white background.
 */
export function GuidancePanel({
  settings,
  onSettingsChange,
  currentPhaseTips = [],
}: GuidancePanelProps) {

  const handleModeSwitch = (mode: GuidanceMode) => {
    onSettingsChange({ guidanceMode: mode })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[360px] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-40">
      <div className="h-full flex flex-col">
        {/* Mode Toggle Header */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleModeSwitch('quick')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                settings.guidanceMode === 'quick'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              aria-label="Quick Tips"
            >
              Quick Tips
            </button>
            <button
              onClick={() => handleModeSwitch('deep-dive')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                settings.guidanceMode === 'deep-dive'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              aria-label="Deep Dive"
            >
              Deep Dive
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full py-6">
            <AnimatePresence mode="wait">
              {settings.guidanceMode === 'quick' ? (
                <motion.div
                  key="quick-tips"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex items-center justify-center"
                >
                  <QuickTipsView
                    tips={currentPhaseTips}
                    autoRotate={settings.showAllTips}
                    interval={settings.autoRotateInterval}
                    shuffleMode={settings.showAllTips}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="deep-dive"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <DeepDiveView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

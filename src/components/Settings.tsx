import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS } from '../domain/GuidanceSettings'
import { PersistenceService } from '../services/PersistenceService'

/**
 * Settings panel with dark mode toggle and language switcher
 */
export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && <SettingsPanel onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

/**
 * Settings panel modal
 */
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })
  const [guidanceSettings, setGuidanceSettings] = useState<GuidanceSettings>(DEFAULT_GUIDANCE_SETTINGS)

  // Load guidance settings on mount
  useEffect(() => {
    const savedSettings = PersistenceService.loadGuidanceSettings()
    if (savedSettings) {
      setGuidanceSettings(savedSettings)
    }
  }, [])

  // Save guidance settings when they change
  useEffect(() => {
    PersistenceService.saveGuidanceSettings(guidanceSettings)
  }, [guidanceSettings])

  // Apply dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleDarkMode = () => setIsDark(!isDark)

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {t('settings.title', 'Settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">
                {t('settings.darkMode', 'Dark Mode')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('settings.darkModeDesc', 'Reduce eye strain in low light')}
              </p>
            </div>
            <ToggleSwitch checked={isDark} onChange={toggleDarkMode} />
          </div>

          {/* Language */}
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              {t('settings.language', 'Language')}
            </h3>
            <div className="flex gap-2">
              <LanguageButton
                code="de"
                label="Deutsch"
                isActive={i18n.language === 'de'}
                onClick={() => changeLanguage('de')}
              />
              <LanguageButton
                code="en"
                label="English"
                isActive={i18n.language === 'en'}
                onClick={() => changeLanguage('en')}
              />
            </div>
          </div>

          {/* Volume */}
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              {t('settings.sound', 'Sound')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.soundDesc', 'Singing bowl sounds for phase transitions')}
            </p>
          </div>

          {/* Guidance Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800 dark:text-white">
              {t('settings.guidance.title', 'Guidance')}
            </h3>

            {/* Enable in Maintain Mode */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">
                  {t('settings.guidance.enableInMaintain', 'Enable in Maintain Mode')}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.guidance.enableInMaintainDesc', 'Show guidance tips during Maintain mode')}
                </p>
              </div>
              <ToggleSwitch
                checked={guidanceSettings.enableInMaintain}
                onChange={() => setGuidanceSettings({
                  ...guidanceSettings,
                  enableInMaintain: !guidanceSettings.enableInMaintain
                })}
              />
            </div>

            {/* Show All Tips */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">
                  {t('settings.guidance.showAllTips', 'Show All Tips')}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.guidance.showAllTipsDesc', 'Display all available tips during session')}
                </p>
              </div>
              <ToggleSwitch
                checked={guidanceSettings.showAllTips}
                onChange={() => setGuidanceSettings({
                  ...guidanceSettings,
                  showAllTips: !guidanceSettings.showAllTips
                })}
              />
            </div>

            {/* Auto-rotate Interval */}
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                {t('settings.guidance.autoRotateInterval', 'Auto-rotate Interval')}
              </h4>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={guidanceSettings.autoRotateInterval}
                  onChange={(e) => setGuidanceSettings({
                    ...guidanceSettings,
                    autoRotateInterval: parseInt(e.target.value)
                  })}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label={t('settings.guidance.autoRotateInterval', 'Auto-rotate Interval')}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                  {guidanceSettings.autoRotateInterval}s
                </span>
              </div>
            </div>

            {/* Guidance Mode */}
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                {t('settings.guidance.mode', 'Guidance Mode')}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setGuidanceSettings({
                    ...guidanceSettings,
                    guidanceMode: 'quick'
                  })}
                  className={`
                    flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm
                    ${guidanceSettings.guidanceMode === 'quick'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  aria-pressed={guidanceSettings.guidanceMode === 'quick'}
                >
                  {t('settings.guidance.quick', 'Quick Tips')}
                </button>
                <button
                  onClick={() => setGuidanceSettings({
                    ...guidanceSettings,
                    guidanceMode: 'deep-dive'
                  })}
                  className={`
                    flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm
                    ${guidanceSettings.guidanceMode === 'deep-dive'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  aria-pressed={guidanceSettings.guidanceMode === 'deep-dive'}
                >
                  {t('settings.guidance.deepDive', 'Deep Dive')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Couples Timer v1.0.0
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Toggle switch component
 */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`
        relative w-12 h-7 rounded-full transition-colors
        ${checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
      `}
    >
      <span
        className={`
          absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform
          ${checked ? 'left-6' : 'left-1'}
        `}
      />
    </button>
  )
}

/**
 * Language button
 */
function LanguageButton({
  code,
  label,
  isActive,
  onClick,
}: {
  code: string
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 px-4 py-2 rounded-lg font-medium transition-colors
        ${isActive
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <span className="text-lg mr-1">{code === 'de' ? '🇩🇪' : '🇬🇧'}</span>
      {label}
    </button>
  )
}

// Icons

function SettingsIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CloseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default SettingsButton

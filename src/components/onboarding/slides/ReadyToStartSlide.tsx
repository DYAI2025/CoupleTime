import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { SlideProps } from '../OnboardingSlider'
import type { SessionMode } from '../../../domain/SessionMode'
import {
  MAINTAIN_MODE,
  COMMITMENT_MODE,
  LISTENING_MODE,
} from '../../../domain/SessionMode.presets'

interface ModeOption {
  mode: SessionMode
  color: string
  duration: string
  recommended?: boolean
}

const modeOptions: ModeOption[] = [
  {
    mode: LISTENING_MODE,
    color: '#8B5CF6',
    duration: '~45 min',
    recommended: true,
  },
  {
    mode: MAINTAIN_MODE,
    color: '#10B981',
    duration: '~90 min',
  },
  {
    mode: COMMITMENT_MODE,
    color: '#F59E0B',
    duration: '~60 min',
  },
]

export function ReadyToStartSlide({ onModeSelect }: SlideProps) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (option: ModeOption) => {
    setSelectedId(option.mode.id)
    onModeSelect?.(option.mode)
  }

  return (
    <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center"
      >
        {t('onboarding.ready.title', 'Choose Your Mode')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-base text-gray-600 dark:text-gray-400 text-center mb-6"
      >
        {t(
          'onboarding.ready.subtitle',
          'We recommend starting with Listening Mode for your first conversation.'
        )}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 max-w-md mx-auto w-full"
      >
        {modeOptions.map((option, index) => (
          <motion.button
            key={option.mode.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() => handleSelect(option)}
            aria-label={t(option.mode.name, option.mode.id)}
            className={`
              w-full p-4 rounded-xl border-2 transition-all text-left
              ${selectedId === option.mode.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {option.mode.id === 'listening' && 'Listening'}
                    {option.mode.id === 'maintain' && 'Maintain'}
                    {option.mode.id === 'commitment' && 'Commitment'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.duration}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {option.recommended && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                    {t('onboarding.ready.recommended', 'Recommended')}
                  </span>
                )}
                {selectedId === option.mode.id && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8"
      >
        {t(
          'onboarding.ready.note',
          'Select a mode, then click "Start Session" to begin your first conversation.'
        )}
      </motion.p>
    </div>
  )
}

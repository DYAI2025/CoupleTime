import { useState, useEffect, useCallback } from 'react'
import { useSession, useSessionViewModel } from '../contexts/SessionContext'
import type { SessionMode } from '../domain/SessionMode'
import { TimerDisplay } from './TimerDisplay'
import { PhaseIndicator } from './PhaseIndicator'
import { ProgressBar, SessionProgressBar } from './ProgressBar'
import { ControlButtons, StartButton } from './ControlButtons'
import { ModeSelector } from './ModeSelector'
import { TipDisplay } from './TipDisplay'
import { SettingsButton } from './Settings'
import { GuidancePanel } from './GuidancePanel'
import { OnboardingModal } from './onboarding/OnboardingModal'
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS } from '../domain/GuidanceSettings'
import { PersistenceService } from '../services/PersistenceService'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

/**
 * Main session view - shows either mode selection or active session
 */
export function SessionView() {
  const viewModel = useSessionViewModel()
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null)

  // Show active session view when running or paused
  if (viewModel.isRunning || viewModel.isPaused) {
    return <ActiveSessionView />
  }

  // Show finished view
  if (viewModel.isFinished) {
    return <FinishedSessionView onRestart={() => setSelectedMode(null)} />
  }

  // Show mode selection
  return (
    <ModeSelectionView
      selectedMode={selectedMode}
      onSelectMode={setSelectedMode}
    />
  )
}

/**
 * Mode selection screen
 */
function ModeSelectionView({
  selectedMode,
  onSelectMode,
}: {
  selectedMode: SessionMode | null
  onSelectMode: (mode: SessionMode | null) => void
}) {
  const { t } = useTranslation()
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleOnboardingComplete = (mode?: SessionMode) => {
    setShowOnboarding(false)
    if (mode) {
      onSelectMode(mode)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* Header */}
      <header className="px-4 py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1" />
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {t('app.title', 'Couples Timer')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('app.subtitle', 'Structured conversation for couples')}
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <SettingsButton />
          </div>
        </div>
      </header>

      {/* Mode selection */}
      <main className="flex-1 px-4 py-6">
        <ModeSelector
          selectedMode={selectedMode}
          onSelectMode={onSelectMode}
        />
      </main>

      {/* Footer with tour button and start button */}
      <footer className="px-4 py-6 space-y-4">
        {/* Take the tour button */}
        <button
          onClick={() => setShowOnboarding(true)}
          className="
            w-full px-4 py-3 rounded-xl
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            font-medium
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-colors
            flex items-center justify-center gap-2
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('onboarding.takeTour', 'Take the tour')}
        </button>

        {/* Start session button */}
        <AnimatePresence>
          {selectedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <StartButton mode={selectedMode} fullWidth />
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  )
}

/**
 * Active session display (running or paused)
 */
function ActiveSessionView() {
  const viewModel = useSessionViewModel()
  const session = useSession()

  // Guidance settings state
  const [guidanceSettings, setGuidanceSettings] = useState<GuidanceSettings>(
    DEFAULT_GUIDANCE_SETTINGS
  )

  // Load guidance settings on mount
  useEffect(() => {
    const settings = PersistenceService.loadGuidanceSettings()
    setGuidanceSettings(settings)
  }, [])

  // Handle settings changes with persistence
  const handleGuidanceSettingsChange = useCallback((partial: Partial<GuidanceSettings>) => {
    setGuidanceSettings(prev => {
      const updated = { ...prev, ...partial }
      PersistenceService.saveGuidanceSettings(updated)
      return updated
    })
  }, [])

  // Get tips from session context
  const currentPhaseTips = session.tips || []

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with mode name and progress */}
      <header className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {viewModel.modeName}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {viewModel.elapsedTimeFormatted}
          </span>
        </div>
        <SessionProgressBar />
      </header>

      {/* Main content - with bottom padding to avoid overlap with fixed guidance panel */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 pb-[360px]">
        {/* Phase indicator */}
        <PhaseIndicator />

        {/* Timer display */}
        <TimerDisplay size="lg" />

        {/* Phase progress */}
        <div className="w-full max-w-xs">
          <ProgressBar variant="phase" height="md" />
        </div>

        {/* Tips */}
        <TipDisplay rotateInterval={15} />
      </main>

      {/* Controls */}
      <footer className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <ControlButtons size="lg" />
        </div>
      </footer>

      {/* Guidance Panel - Fixed at bottom */}
      <GuidancePanel
        settings={guidanceSettings}
        onSettingsChange={handleGuidanceSettingsChange}
        currentPhaseTips={currentPhaseTips}
      />
    </div>
  )
}

/**
 * Session finished view
 */
function FinishedSessionView({ onRestart }: { onRestart: () => void }) {
  const { t } = useTranslation()
  const viewModel = useSessionViewModel()
  const { stop } = useSession()

  const handleNewSession = () => {
    stop()
    onRestart()
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md"
      >
        {/* Celebration icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {t('session.finished.title', 'Session Complete!')}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('session.finished.message', 'Great job completing your conversation session.')}
        </p>

        {/* Session summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {t('session.finished.mode', 'Mode')}
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {viewModel.modeName}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-500 dark:text-gray-400">
              {t('session.finished.duration', 'Duration')}
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {viewModel.elapsedTimeFormatted}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleNewSession}
            className="
              w-full px-6 py-3 rounded-xl
              bg-blue-500 hover:bg-blue-600
              text-white font-semibold
              transition-colors
            "
          >
            {t('session.finished.newSession', 'Start New Session')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * Compact session view for embedded use
 */
export function SessionViewCompact() {
  const viewModel = useSessionViewModel()

  if (viewModel.isIdle) {
    return null
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="flex-1">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {viewModel.phaseDisplayName}
        </div>
        <div className="text-2xl font-mono font-bold text-gray-800 dark:text-white">
          {viewModel.remainingTimeFormatted}
        </div>
      </div>
      <ControlButtons size="sm" />
    </div>
  )
}

// Icons
function CheckCircleIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default SessionView

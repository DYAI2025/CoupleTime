import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { SessionEngine } from '../domain/SessionEngine'
import { SessionState, createInitialState } from '../domain/SessionState'
import { SessionMode } from '../domain/SessionMode'
import { MAINTAIN_MODE, COMMITMENT_MODE, LISTENING_MODE } from '../domain/SessionMode.presets'
import { SessionViewModel, createSessionViewModel } from '../viewmodels/SessionViewModel'
import { AudioService, AudioServiceProtocol } from '../services/AudioService'
import { TimerService, TimerServiceProtocol } from '../services/TimerService'
import { GuidanceService, GuidanceServiceProtocol } from '../services/GuidanceService'
import { PersistenceService, PersistenceServiceProtocol } from '../services/PersistenceService'
import { ParticipantConfig, createDefaultParticipantConfig } from '../domain/ParticipantConfig'
import { participantPersistenceService } from '../services/ParticipantPersistenceService'

/**
 * Session context value
 */
interface SessionContextValue {
  // View model (UI-ready state)
  viewModel: SessionViewModel

  // Raw state (for advanced use)
  state: SessionState

  // Participant configuration
  participantConfig: ParticipantConfig

  // Actions
  start: (mode: SessionMode, participantConfig?: ParticipantConfig) => Promise<boolean>
  pause: () => void
  resume: () => void
  stop: () => void
  updateParticipantConfig: (config: ParticipantConfig) => void

  // Presets
  presets: SessionMode[]

  // Custom modes
  customModes: SessionMode[]
  addCustomMode: (mode: SessionMode) => void
  updateCustomMode: (mode: SessionMode) => void
  deleteCustomMode: (modeId: string) => void

  // Tips
  tips: string[]
  randomTip: string | null
}

const SessionContext = createContext<SessionContextValue | null>(null)

/**
 * Props for SessionProvider
 */
interface SessionProviderProps {
  children: React.ReactNode
  // Allow injecting services for testing
  audioService?: AudioServiceProtocol
  timerService?: TimerServiceProtocol
  guidanceService?: GuidanceServiceProtocol
  persistenceService?: PersistenceServiceProtocol
}

/**
 * Session provider component
 */
export function SessionProvider({
  children,
  audioService = AudioService,
  timerService = TimerService,
  guidanceService = GuidanceService,
  persistenceService = PersistenceService,
}: SessionProviderProps) {
  // Session engine instance
  const engineRef = useRef<SessionEngine | null>(null)

  // Initialize engine once
  if (!engineRef.current) {
    engineRef.current = new SessionEngine(audioService, timerService, guidanceService)
  }
  const engine = engineRef.current

  // Session state
  const [state, setState] = useState<SessionState>(createInitialState)

  // Participant configuration
  const [participantConfig, setParticipantConfig] = useState<ParticipantConfig>(() =>
    participantPersistenceService.loadConfig()
  )

  // Custom modes from persistence
  const [customModes, setCustomModes] = useState<SessionMode[]>(() =>
    persistenceService.loadCustomModes()
  )

  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = engine.subscribe(setState)
    return unsubscribe
  }, [engine])

  // Actions
  const start = useCallback(async (mode: SessionMode, participantConfig?: ParticipantConfig): Promise<boolean> => {
    const config = participantConfig || participantPersistenceService.loadConfig()
    const success = await engine.start(mode, config)
    if (success) {
      persistenceService.updateSetting('lastUsedModeId', mode.id)
    }
    return success
  }, [engine, persistenceService])

  const pause = useCallback(() => {
    engine.pause()
  }, [engine])

  const resume = useCallback(() => {
    engine.resume()
  }, [engine])

  const stop = useCallback(() => {
    engine.stop()
  }, [engine])

  const updateParticipantConfig = useCallback((config: ParticipantConfig) => {
    participantPersistenceService.saveConfig(config)
    setParticipantConfig(config)
  }, [])

  // Custom mode management
  const addCustomMode = useCallback((mode: SessionMode) => {
    persistenceService.addCustomMode(mode)
    setCustomModes(persistenceService.loadCustomModes())
  }, [persistenceService])

  const updateCustomMode = useCallback((mode: SessionMode) => {
    persistenceService.updateCustomMode(mode)
    setCustomModes(persistenceService.loadCustomModes())
  }, [persistenceService])

  const deleteCustomMode = useCallback((modeId: string) => {
    persistenceService.deleteCustomMode(modeId)
    setCustomModes(persistenceService.loadCustomModes())
  }, [persistenceService])

  // Presets
  const presets = useMemo(() => [
    MAINTAIN_MODE,
    COMMITMENT_MODE,
    LISTENING_MODE,
  ], [])

  // View model
  const viewModel = useMemo(() => createSessionViewModel(state, participantConfig), [state, participantConfig])

  // Tips
  const tips = useMemo(() => engine.getTips(), [state]) // eslint-disable-line react-hooks/exhaustive-deps
  const randomTip = useMemo(() => engine.getRandomTip(), [state.currentPhaseIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const value: SessionContextValue = {
    viewModel,
    state,
    participantConfig,
    start,
    pause,
    resume,
    stop,
    updateParticipantConfig,
    presets,
    customModes,
    addCustomMode,
    updateCustomMode,
    deleteCustomMode,
    tips,
    randomTip,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

/**
 * Hook to access session context
 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

/**
 * Hook for session view model only (performance optimization)
 */
export function useSessionViewModel(): SessionViewModel {
  const { viewModel } = useSession()
  return viewModel
}

/**
 * Hook for session actions only
 */
export function useSessionActions() {
  const { start, pause, resume, stop } = useSession()
  return { start, pause, resume, stop }
}

/**
 * Hook for available modes (presets + custom)
 */
export function useAvailableModes(): SessionMode[] {
  const { presets, customModes } = useSession()
  return useMemo(() => [...presets, ...customModes], [presets, customModes])
}

/**
 * Hook for custom mode management
 */
export function useCustomModes() {
  const { customModes, addCustomMode, updateCustomMode, deleteCustomMode } = useSession()
  return { customModes, addCustomMode, updateCustomMode, deleteCustomMode }
}

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { SessionEngine } from '../domain/SessionEngine'
import { SessionState, createInitialState } from '../domain/SessionState'
import { SessionMode } from '../domain/SessionMode'
import { PRESET_MODES } from '../domain/SessionMode.presets'
import { SessionViewModel, createSessionViewModel } from '../viewmodels/SessionViewModel'
import { AudioService, AudioServiceProtocol } from '../services/AudioService'
import { TimerService, TimerServiceProtocol } from '../services/TimerService'
import { GuidanceService, GuidanceServiceProtocol } from '../services/GuidanceService'
import { PersistenceService, PersistenceServiceProtocol } from '../services/PersistenceService'
import { ParticipantConfig } from '../domain/ParticipantConfig'
import { participantPersistenceService } from '../services/ParticipantPersistenceService'
import { AudioRecorderService, RecordingState } from '../services/AudioRecorderService'
import { SessionStatus } from '../domain/SessionState'
import {
  isVibeMindEnabled,
  createSession as vibemindCreateSession,
  uploadRecording as vibemindUpload,
  triggerTranscription as vibemindTranscribe,
  startStatusPolling,
} from '../services/VibeMindService'

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

  // Audio recording
  isRecording: boolean
  recordingEnabled: boolean
  toggleRecording: () => void

  // VibeMind upload status
  uploadStatus: 'idle' | 'uploading' | 'uploaded' | 'error'
  lastSessionId: string | null
  transcriptReady: boolean
  summaryReady: boolean
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
  // Audio recorder
  const recorderRef = useRef<AudioRecorderService>(new AudioRecorderService())
  const [isRecording, setIsRecording] = useState(false)
  const [recordingEnabled, setRecordingEnabled] = useState(false)
  const prevPhaseIndexRef = useRef<number>(-1)
  const prevStatusRef = useRef<SessionStatus>(SessionStatus.Idle)

  // VibeMind upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle')
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)
  const [transcriptReady, setTranscriptReady] = useState(false)
  const [summaryReady, setSummaryReady] = useState(false)
  const pollingCancelRef = useRef<(() => void) | null>(null)
  // Snapshot of the mode/participants active when the session started, for upload
  const sessionMetaRef = useRef<{
    modeId: string
    modeName: string
    nameA: string
    nameB: string
  } | null>(null)

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

  // Recording lifecycle: start/stop with session, mark phase transitions
  useEffect(() => {
    const recorder = recorderRef.current
    const prevStatus = prevStatusRef.current
    const prevPhase = prevPhaseIndexRef.current

    if (recordingEnabled) {
      // Session just started
      if (state.status === SessionStatus.Running && prevStatus !== SessionStatus.Running && prevStatus !== SessionStatus.Paused) {
        navigator.mediaDevices?.getUserMedia({ audio: true })
          .then((stream) => {
            return recorder.startRecording(stream).then(() => {
              setIsRecording(true)
              // Mark initial phase immediately so first phase is not lost
              if (state.mode) {
                const firstPhase = state.mode.phases[state.currentPhaseIndex]
                if (firstPhase) recorder.markPhase(firstPhase.type, 0)
              }
            })
          })
          .catch(() => { /* mic denied — recording silently skipped */ })
      }

      // Phase changed during recording (use service state — not stale React isRecording)
      if (recorder.getState() === RecordingState.Recording && state.currentPhaseIndex !== prevPhase && state.mode) {
        const phase = state.mode.phases[state.currentPhaseIndex]
        if (phase) recorder.markPhase(phase.type, Math.round(state.elapsedSessionTime))
      }

      // Session stopped or finished — use service state to avoid stale closure
      if ((state.status === SessionStatus.Finished || state.status === SessionStatus.Idle) &&
          (prevStatus === SessionStatus.Running || prevStatus === SessionStatus.Paused) &&
          recorder.getState() === RecordingState.Recording) {
        recorder.stopRecording().then(async (blob) => {
          setIsRecording(false)
          if (!isVibeMindEnabled()) return
          const meta = sessionMetaRef.current
          if (!meta) return
          setUploadStatus('uploading')
          try {
            const { session_id } = await vibemindCreateSession({
              participant_name_a: meta.nameA,
              participant_name_b: meta.nameB,
              mode_name: meta.modeName,
              mode_id: meta.modeId,
            })
            setLastSessionId(session_id)
            await vibemindUpload(session_id, blob, recorder.getPhaseMarkers())
            await vibemindTranscribe(session_id)
            setUploadStatus('uploaded')
            const cancel = startStatusPolling(session_id, (data) => {
              if (data.transcript_available) setTranscriptReady(true)
              if (data.summary_available) setSummaryReady(true)
            })
            pollingCancelRef.current = cancel
          } catch {
            setUploadStatus('error')
          }
        })
      }
    }

    prevStatusRef.current = state.status
    prevPhaseIndexRef.current = state.currentPhaseIndex
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.currentPhaseIndex, recordingEnabled, state.mode])

  // Actions
  const start = useCallback(async (mode: SessionMode, participantConfig?: ParticipantConfig): Promise<boolean> => {
    const config = participantConfig || participantPersistenceService.loadConfig()
    const success = await engine.start(mode, config)
    if (success) {
      persistenceService.updateSetting('lastUsedModeId', mode.id)
      // Snapshot meta for upload after the session ends
      sessionMetaRef.current = {
        modeId: mode.id,
        modeName: mode.name,
        nameA: config.nameA,
        nameB: config.nameB,
      }
      setUploadStatus('idle')
      setLastSessionId(null)
      setTranscriptReady(false)
      setSummaryReady(false)
      if (pollingCancelRef.current) {
        pollingCancelRef.current()
        pollingCancelRef.current = null
      }
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

  const toggleRecording = useCallback(() => {
    setRecordingEnabled((prev) => !prev)
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
  const presets = PRESET_MODES

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
    isRecording,
    recordingEnabled,
    toggleRecording,
    uploadStatus,
    lastSessionId,
    transcriptReady,
    summaryReady,
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

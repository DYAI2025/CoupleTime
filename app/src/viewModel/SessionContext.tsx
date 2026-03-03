import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from 'react'
import type { SessionMode } from '@/domain/SessionMode'
import { getTotalDuration } from '@/domain/SessionMode'
import type { PhaseConfig } from '@/domain/PhaseConfig'
import { SessionEngine, type SessionState, loadSavedSessionState } from '@/domain/SessionEngine'
import { getTimerService } from '@/services/TimerService'
import { getAudioService } from '@/services/AudioService'
import { getStreakService } from '@/services/StreakService'
import { getParticipantService, type ParticipantConfig } from '@/services/ParticipantService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

// ── Phase instruction maps (with {nameA}/{nameB} placeholders) ────────────────

const INSTRUCTION_MAP: Record<string, string> = {
  prep:       'Bitte ankommen',
  slotA:      '{nameA} spricht',
  slotB:      '{nameB} spricht',
  transition: 'Kurze Pause',
  closingA:   '{nameA} – Abschluss',
  closingB:   '{nameB} – Abschluss',
  cooldown:   'Stille – kein Nachgespräch',
}

const SUBTITLE_MAP: Record<string, string> = {
  prep:       'Atmet tief durch und kommt zur Ruhe.',
  slotA:      '{nameB}: Bitte still zuhören, nicht unterbrechen.',
  slotB:      '{nameA}: Bitte still zuhören, nicht unterbrechen.',
  transition: 'Verarbeitet das Gehörte in Stille.',
  closingA:   '{nameB}: Bitte still zuhören.',
  closingB:   '{nameA}: Bitte still zuhören.',
  cooldown:   'Lasst das Gespräch wirken. Keine Diskussion jetzt.',
}

function substitute(template: string, names: ParticipantConfig): string {
  return template
    .replace(/\{nameA\}/g, names.nameA)
    .replace(/\{nameB\}/g, names.nameB)
}

// ── Context type ──────────────────────────────────────────────────────────────

export interface SessionContextValue {
  // State
  status: SessionState['status']
  isRunning: boolean
  isPaused: boolean
  isFinished: boolean
  selectedMode: SessionMode | null
  hasSavedSession: boolean

  // Participant
  nameA: string
  nameB: string
  transitionSec: number
  setParticipant: (nameA: string, nameB: string) => void
  setTransitionSec: (sec: number) => void

  // Phase
  currentPhase: PhaseConfig | null
  currentPhaseIndex: number
  totalPhases: number
  remainingTimeFormatted: string
  remainingSeconds: number
  progressFraction: number
  sessionProgressFraction: number

  // Speaker / instruction
  speaker: 'A' | 'B' | null
  speakerName: string
  phaseInstruction: string
  phaseSubtitle: string
  phaseFocusText: string    // custom focus text from PhaseConfig

  // Preview
  nextPhase: PhaseConfig | null

  // Actions
  selectMode: (mode: SessionMode) => void
  start: (mode: SessionMode) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  restoreSavedSession: () => void
  discardSavedSession: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<SessionEngine | null>(null)
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null)
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const [engineState, setEngineState] = useState<SessionState>({
    status: 'idle', mode: null, currentPhaseIndex: 0,
    remainingTime: 0, elapsedSessionTime: 0,
    startedAt: null, pausedAt: null, totalPausedTime: 0,
  })
  const [participant, setParticipantState] = useState<ParticipantConfig>(
    () => getParticipantService().get()
  )

  // Create engine + check for saved session
  useEffect(() => {
    const engine = new SessionEngine(getTimerService(), getAudioService())
    engineRef.current = engine

    const unsub = engine.subscribe(({ state }) => {
      setEngineState(state)
      if (state.mode) setSelectedMode(state.mode)
      if (state.status === 'finished' && state.mode) {
        getStreakService().recordCompletedSession(
          state.mode.id, state.mode.name, getTotalDuration(state.mode)
        )
      }
    })

    // Check for saved session (reload recovery)
    const saved = loadSavedSessionState()
    if (saved) setHasSavedSession(true)

    return () => { unsub(); engine.stop() }
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const selectMode = useCallback((m: SessionMode) => setSelectedMode(m), [])

  const start = useCallback(async (mode: SessionMode) => {
    setSelectedMode(mode)
    setHasSavedSession(false)
    await engineRef.current?.start(mode)
  }, [])

  const pause  = useCallback(() => engineRef.current?.pause(),  [])
  const resume = useCallback(() => engineRef.current?.resume(), [])
  const stop   = useCallback(() => {
    engineRef.current?.stop()
    setSelectedMode(null)
    setHasSavedSession(false)
  }, [])

  const restoreSavedSession = useCallback(() => {
    const saved = loadSavedSessionState()
    if (!saved) return
    engineRef.current?.restoreFromState(saved)
    setHasSavedSession(false)
  }, [])

  const discardSavedSession = useCallback(() => {
    try { localStorage.removeItem('ct.v1.session-state') } catch { /* */ }
    setHasSavedSession(false)
  }, [])

  const setParticipant = useCallback((a: string, b: string) => {
    getParticipantService().setNames(a, b)
    setParticipantState(getParticipantService().get())
  }, [])

  const setTransitionSec = useCallback((sec: number) => {
    getParticipantService().setTransitionSec(sec)
    setParticipantState(getParticipantService().get())
  }, [])

  // ── Derived values ───────────────────────────────────────────────────────────

  const mode = engineState.mode
  const phases = mode?.phases ?? []
  const idx = engineState.currentPhaseIndex
  const currentPhase: PhaseConfig | null = phases[idx] ?? null
  const nextPhase: PhaseConfig | null = phases[idx + 1] ?? null
  const totalPhases = phases.length

  const remaining = engineState.remainingTime
  const phaseDuration = currentPhase?.duration ?? 0
  const progress = phaseDuration > 0 ? Math.min(1, Math.max(0, (phaseDuration - remaining) / phaseDuration)) : 0

  const totalDuration = phases.reduce((s, p) => s + p.duration, 0)
  const sessionProgress = totalDuration > 0
    ? Math.min(1, engineState.elapsedSessionTime / totalDuration) : 0

  const speakerMap: Record<string, 'A' | 'B'> = { slotA: 'A', closingA: 'A', slotB: 'B', closingB: 'B' }
  const speaker = currentPhase ? (speakerMap[currentPhase.type] ?? null) : null
  const speakerName = speaker === 'A' ? participant.nameA : speaker === 'B' ? participant.nameB : ''

  const phaseType = currentPhase?.type ?? ''
  const phaseInstruction = substitute(INSTRUCTION_MAP[phaseType] ?? '', participant)
  const phaseSubtitle    = substitute(SUBTITLE_MAP[phaseType]    ?? '', participant)
  // Custom focusText from PhaseConfig takes priority, substitute names too
  const phaseFocusText   = substitute(currentPhase?.focusText ?? '', participant)

  // ── Value ────────────────────────────────────────────────────────────────────

  const value: SessionContextValue = {
    status: engineState.status,
    isRunning:  engineState.status === 'running',
    isPaused:   engineState.status === 'paused',
    isFinished: engineState.status === 'finished',
    selectedMode: selectedMode ?? mode,
    hasSavedSession,

    nameA: participant.nameA,
    nameB: participant.nameB,
    transitionSec: participant.transitionSec,
    setParticipant,
    setTransitionSec,

    currentPhase,
    currentPhaseIndex: idx,
    totalPhases,
    remainingTimeFormatted: fmtTime(remaining),
    remainingSeconds: remaining,
    progressFraction: progress,
    sessionProgressFraction: sessionProgress,

    speaker,
    speakerName,
    phaseInstruction,
    phaseSubtitle,
    phaseFocusText,
    nextPhase,

    selectMode,
    start,
    pause,
    resume,
    stop,
    restoreSavedSession,
    discardSavedSession,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

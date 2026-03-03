import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from 'react'
import type { SessionMode } from '@/domain/SessionMode'
import { getTotalDuration } from '@/domain/SessionMode'
import type { PhaseConfig } from '@/domain/PhaseConfig'
import { SessionEngine, type SessionState } from '@/domain/SessionEngine'
import { getStreakService } from '@/services/StreakService'
import { getTimerService } from '@/services/TimerService'
import { getAudioService } from '@/services/AudioService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function phaseProgress(remaining: number, totalDuration: number): number {
  if (totalDuration <= 0) return 0
  return Math.min(1, Math.max(0, (totalDuration - remaining) / totalDuration))
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionContextValue {
  // State
  status: SessionState['status']
  isRunning: boolean
  isPaused: boolean
  isFinished: boolean
  selectedMode: SessionMode | null

  // Current phase
  currentPhase: PhaseConfig | null
  currentPhaseIndex: number
  totalPhases: number
  remainingTimeFormatted: string
  remainingSeconds: number
  progressFraction: number      // 0–1, current phase
  sessionProgressFraction: number // 0–1, whole session

  // Speaker / role
  speaker: 'A' | 'B' | null    // null = no speaker (prep/transition/cooldown)
  speakerName: string           // "Partner A" etc.
  phaseInstruction: string      // big action text shown on screen
  phaseSubtitle: string         // secondary instruction

  // Next phase preview
  nextPhase: PhaseConfig | null

  // Tips
  tips: string[]

  // Actions
  selectMode: (mode: SessionMode) => void
  start: (mode: SessionMode) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<SessionEngine | null>(null)

  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null)
  const [engineState, setEngineState] = useState<SessionState>({
    status: 'idle',
    mode: null,
    currentPhaseIndex: 0,
    remainingTime: 0,
    elapsedSessionTime: 0,
    startedAt: null,
    pausedAt: null,
    totalPausedTime: 0,
  })

  // Create engine once
  useEffect(() => {
    const engine = new SessionEngine(getTimerService(), getAudioService())
    engineRef.current = engine

    const unsub = engine.subscribe(({ state }) => {
      setEngineState(state)

      // Record streak when session finishes
      if (state.status === 'finished' && state.mode) {
        getStreakService().recordCompletedSession(
          state.mode.id,
          state.mode.name,
          getTotalDuration(state.mode),
        )
      }
    })

    return () => {
      unsub()
      engine.stop()
    }
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const selectMode = useCallback((mode: SessionMode) => setSelectedMode(mode), [])

  const start = useCallback(async (mode: SessionMode) => {
    setSelectedMode(mode)
    await engineRef.current?.start(mode)
  }, [])

  const pause  = useCallback(() => engineRef.current?.pause(),  [])
  const resume = useCallback(() => engineRef.current?.resume(), [])
  const stop   = useCallback(() => {
    engineRef.current?.stop()
    setSelectedMode(null)
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
  const progress = phaseProgress(remaining, phaseDuration)

  // Session-wide progress
  const totalDuration = phases.reduce((s, p) => s + p.duration, 0)
  const sessionProgress = totalDuration > 0
    ? Math.min(1, engineState.elapsedSessionTime / totalDuration)
    : 0

  // Speaker
  type SpeakerType = 'A' | 'B' | null
  const speakerMap: Record<string, SpeakerType> = {
    slotA: 'A', closingA: 'A',
    slotB: 'B', closingB: 'B',
  }
  const speaker: SpeakerType = currentPhase ? (speakerMap[currentPhase.type] ?? null) : null
  const speakerName = speaker === 'A' ? 'Partner A' : speaker === 'B' ? 'Partner B' : ''

  // Big instruction text for the session screen
  const phaseInstructionMap: Record<string, string> = {
    prep:      'Bitte ankommen',
    slotA:     'Partner A spricht',
    slotB:     'Partner B spricht',
    transition:'Kurze Pause',
    closingA:  'Partner A – Abschluss',
    closingB:  'Partner B – Abschluss',
    cooldown:  'Stille – kein Nachgespräch',
  }
  const phaseSubtitleMap: Record<string, string> = {
    prep:      'Atmet tief durch und kommt zur Ruhe.',
    slotA:     'Partner B: Bitte still zuhören.',
    slotB:     'Partner A: Bitte still zuhören.',
    transition:'Verarbeitet das Gehörte in Stille.',
    closingA:  'Partner B: Bitte still zuhören.',
    closingB:  'Partner A: Bitte still zuhören.',
    cooldown:  'Lasst das Gespräch wirken. Keine Diskussion jetzt.',
  }
  const phaseInstruction = currentPhase ? (phaseInstructionMap[currentPhase.type] ?? '') : ''
  const phaseSubtitle    = currentPhase ? (phaseSubtitleMap[currentPhase.type]    ?? '') : ''

  // Tips (guidance)
  const tipsMap: Record<string, string[]> = {
    prep: [
      'Atmet ein paar Mal tief durch.',
      'Legt Smartphones und Ablenkungen zur Seite.',
      'Öffnet euch für das, was kommen mag.',
    ],
    transition: [
      'Verarbeitet das Gehörte in Stille.',
      'Was hat euch besonders berührt?',
      'Bleibt präsent und aufmerksam.',
    ],
    cooldown: [
      'Lasst das Gespräch nachwirken.',
      'Vermeidet jetzt weitere Diskussionen.',
      'Genießt die gemeinsame Stille.',
    ],
  }
  const tips = currentPhase ? (tipsMap[currentPhase.type] ?? []) : []

  // ── Value ────────────────────────────────────────────────────────────────────

  const value: SessionContextValue = {
    status: engineState.status,
    isRunning: engineState.status === 'running',
    isPaused: engineState.status === 'paused',
    isFinished: engineState.status === 'finished',
    selectedMode: selectedMode ?? mode,

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

    nextPhase,
    tips,

    selectMode,
    start,
    pause,
    resume,
    stop,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

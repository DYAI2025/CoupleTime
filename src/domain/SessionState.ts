import { PhaseConfig } from './PhaseConfig'
import { SessionMode } from './SessionMode'
import { ParticipantConfig } from './ParticipantConfig'

/**
 * Session status enum
 */
export enum SessionStatus {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
  Finished = 'finished',
}

/**
 * Complete state of a running session
 */
export interface SessionState {
  /** Current status */
  status: SessionStatus

  /** The mode being used */
  mode: SessionMode | null

  /** Index of current phase in mode.phases */
  currentPhaseIndex: number

  /** Remaining time in current phase (seconds) */
  remainingTime: number

  /** Total elapsed time since session start (seconds) */
  elapsedSessionTime: number

  /** Timestamp when session started (ms since epoch) */
  startedAt: number | null

  /** Timestamp when paused (ms since epoch) */
  pausedAt: number | null

  /** Total time spent paused (ms) */
  totalPausedTime: number

  /** Participant configuration (names and colors) */
  participantConfig: ParticipantConfig | null
}

/**
 * Create initial idle state
 */
export function createInitialState(): SessionState {
  return {
    status: SessionStatus.Idle,
    mode: null,
    currentPhaseIndex: 0,
    remainingTime: 0,
    elapsedSessionTime: 0,
    startedAt: null,
    pausedAt: null,
    totalPausedTime: 0,
    participantConfig: null,
  }
}

/**
 * Check if session is currently active (running or paused)
 */
export function isSessionActive(state: SessionState): boolean {
  return state.status === SessionStatus.Running || state.status === SessionStatus.Paused
}

/**
 * Check if session is running (not paused)
 */
export function isSessionRunning(state: SessionState): boolean {
  return state.status === SessionStatus.Running
}

/**
 * Check if session is paused
 */
export function isSessionPaused(state: SessionState): boolean {
  return state.status === SessionStatus.Paused
}

/**
 * Check if session is finished
 */
export function isSessionFinished(state: SessionState): boolean {
  return state.status === SessionStatus.Finished
}

/**
 * Check if session is idle (not started)
 */
export function isSessionIdle(state: SessionState): boolean {
  return state.status === SessionStatus.Idle
}

/**
 * Get current phase config from state
 */
export function getCurrentPhase(state: SessionState): PhaseConfig | null {
  if (!state.mode) return null
  if (state.currentPhaseIndex < 0 || state.currentPhaseIndex >= state.mode.phases.length) {
    return null
  }
  return state.mode.phases[state.currentPhaseIndex]
}

/**
 * Check if current phase is the last phase
 */
export function isLastPhase(state: SessionState): boolean {
  if (!state.mode) return false
  return state.currentPhaseIndex >= state.mode.phases.length - 1
}

/**
 * Get progress through current phase (0 to 1)
 */
export function getPhaseProgress(state: SessionState): number {
  const phase = getCurrentPhase(state)
  if (!phase) return 0
  if (phase.duration === 0) return 1

  const elapsed = phase.duration - state.remainingTime
  return Math.min(1, Math.max(0, elapsed / phase.duration))
}

/**
 * Get total session progress (0 to 1)
 */
export function getSessionProgress(state: SessionState): number {
  if (!state.mode) return 0

  const totalDuration = state.mode.phases.reduce((sum, p) => sum + p.duration, 0)
  if (totalDuration === 0) return 1

  return Math.min(1, Math.max(0, state.elapsedSessionTime / totalDuration))
}

/**
 * Get number of remaining phases (including current)
 */
export function getRemainingPhaseCount(state: SessionState): number {
  if (!state.mode) return 0
  return state.mode.phases.length - state.currentPhaseIndex
}

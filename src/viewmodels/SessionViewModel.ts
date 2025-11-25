import { SessionState, SessionStatus, getCurrentPhase, getPhaseProgress, getSessionProgress } from '../domain/SessionState'
import { PhaseType, getPhaseDisplayName, getPhaseColor } from '../domain/PhaseType'
import { Speaker, getSpeakerForPhase, getSpeakerDisplayName } from '../domain/Speaker'
import { formatDuration } from '../domain/PhaseConfig'

/**
 * UI-ready view model for session display
 */
export interface SessionViewModel {
  // Status
  status: SessionStatus
  isIdle: boolean
  isRunning: boolean
  isPaused: boolean
  isFinished: boolean

  // Time display
  remainingTimeFormatted: string
  remainingSeconds: number
  elapsedTimeFormatted: string
  elapsedSeconds: number

  // Phase info
  currentPhaseIndex: number
  totalPhases: number
  phaseType: PhaseType | null
  phaseDisplayName: string
  phaseColor: string

  // Speaker info
  speaker: Speaker
  speakerDisplayName: string
  isSpeakerA: boolean
  isSpeakerB: boolean

  // Progress
  phaseProgress: number // 0 to 1
  sessionProgress: number // 0 to 1
  phaseProgressPercent: number // 0 to 100
  sessionProgressPercent: number // 0 to 100

  // Mode info
  modeName: string | null
  modeId: string | null

  // Actions available
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canStop: boolean
}

/**
 * Transform SessionState into SessionViewModel
 */
export function createSessionViewModel(state: SessionState): SessionViewModel {
  const currentPhase = getCurrentPhase(state)
  const phaseType = currentPhase?.type ?? null
  const speaker = phaseType ? getSpeakerForPhase(phaseType) : Speaker.None

  const phaseProgress = getPhaseProgress(state)
  const sessionProgress = getSessionProgress(state)

  return {
    // Status
    status: state.status,
    isIdle: state.status === SessionStatus.Idle,
    isRunning: state.status === SessionStatus.Running,
    isPaused: state.status === SessionStatus.Paused,
    isFinished: state.status === SessionStatus.Finished,

    // Time display
    remainingTimeFormatted: formatDuration(Math.round(state.remainingTime)),
    remainingSeconds: state.remainingTime,
    elapsedTimeFormatted: formatDuration(Math.round(state.elapsedSessionTime)),
    elapsedSeconds: state.elapsedSessionTime,

    // Phase info
    currentPhaseIndex: state.currentPhaseIndex,
    totalPhases: state.mode?.phases.length ?? 0,
    phaseType,
    phaseDisplayName: phaseType ? getPhaseDisplayName(phaseType) : '',
    phaseColor: phaseType ? getPhaseColor(phaseType) : 'gray',

    // Speaker info
    speaker,
    speakerDisplayName: getSpeakerDisplayName(speaker),
    isSpeakerA: speaker === Speaker.A,
    isSpeakerB: speaker === Speaker.B,

    // Progress
    phaseProgress,
    sessionProgress,
    phaseProgressPercent: Math.round(phaseProgress * 100),
    sessionProgressPercent: Math.round(sessionProgress * 100),

    // Mode info
    modeName: state.mode?.name ?? null,
    modeId: state.mode?.id ?? null,

    // Actions available
    canStart: state.status === SessionStatus.Idle || state.status === SessionStatus.Finished,
    canPause: state.status === SessionStatus.Running,
    canResume: state.status === SessionStatus.Paused,
    canStop: state.status === SessionStatus.Running || state.status === SessionStatus.Paused,
  }
}

/**
 * Get i18n key for current status
 */
export function getStatusI18nKey(status: SessionStatus): string {
  switch (status) {
    case SessionStatus.Idle:
      return 'session.status.idle'
    case SessionStatus.Running:
      return 'session.status.running'
    case SessionStatus.Paused:
      return 'session.status.paused'
    case SessionStatus.Finished:
      return 'session.status.finished'
  }
}

/**
 * Get i18n key for phase type
 */
export function getPhaseI18nKey(phaseType: PhaseType): string {
  return `phases.${phaseType}`
}

/**
 * Get i18n key for speaker
 */
export function getSpeakerI18nKey(speaker: Speaker): string {
  switch (speaker) {
    case Speaker.A:
      return 'speaker.a'
    case Speaker.B:
      return 'speaker.b'
    case Speaker.None:
      return 'speaker.none'
  }
}

/**
 * Create an empty/idle view model
 */
export function createIdleViewModel(): SessionViewModel {
  return {
    status: SessionStatus.Idle,
    isIdle: true,
    isRunning: false,
    isPaused: false,
    isFinished: false,

    remainingTimeFormatted: '0:00',
    remainingSeconds: 0,
    elapsedTimeFormatted: '0:00',
    elapsedSeconds: 0,

    currentPhaseIndex: 0,
    totalPhases: 0,
    phaseType: null,
    phaseDisplayName: '',
    phaseColor: 'gray',

    speaker: Speaker.None,
    speakerDisplayName: '',
    isSpeakerA: false,
    isSpeakerB: false,

    phaseProgress: 0,
    sessionProgress: 0,
    phaseProgressPercent: 0,
    sessionProgressPercent: 0,

    modeName: null,
    modeId: null,

    canStart: true,
    canPause: false,
    canResume: false,
    canStop: false,
  }
}

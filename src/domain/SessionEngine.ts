import {
  SessionState,
  SessionStatus,
  createInitialState,
  getCurrentPhase,
  isLastPhase,
} from './SessionState'
import { SessionMode, isSessionModeValid } from './SessionMode'
import { ParticipantConfig } from './ParticipantConfig'
import { PhaseType } from './PhaseType'
import { AudioEvent } from './AudioEvent'
import { AudioServiceProtocol } from '../services/AudioService'
import { TimerServiceProtocol, TimerCallback } from '../services/TimerService'
import { GuidanceServiceProtocol } from '../services/GuidanceService'

/**
 * Callback for state changes
 */
export type StateChangeCallback = (state: SessionState) => void

/**
 * SessionEngine - Central state machine for session control
 *
 * Responsibilities:
 * - Manage session state (idle, running, paused, finished)
 * - Control phase transitions
 * - Trigger audio events
 * - Track elapsed time
 * - NO skip functionality for individual phases
 */
export class SessionEngine {
  private state: SessionState = createInitialState()
  private audioService: AudioServiceProtocol
  private timerService: TimerServiceProtocol
  private guidanceService: GuidanceServiceProtocol
  private onStateChange: StateChangeCallback | null = null

  // Track phase start time for accurate remaining time calculation
  private phaseStartElapsed: number = 0

  constructor(
    audioService: AudioServiceProtocol,
    timerService: TimerServiceProtocol,
    guidanceService: GuidanceServiceProtocol
  ) {
    this.audioService = audioService
    this.timerService = timerService
    this.guidanceService = guidanceService
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: StateChangeCallback): () => void {
    this.onStateChange = callback
    // Immediately notify with current state
    callback(this.getState())
    return () => {
      this.onStateChange = null
    }
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): SessionState {
    return { ...this.state }
  }

  /**
   * Start a new session with the given mode
   */
  async start(mode: SessionMode, participantConfig?: ParticipantConfig): Promise<boolean> {
    // Validate mode
    if (!isSessionModeValid(mode)) {
      console.error('Cannot start session: invalid mode')
      return false
    }

    // Stop any existing session
    if (this.state.status !== SessionStatus.Idle) {
      this.stop()
    }

    // Initialize state
    const firstPhase = mode.phases[0]
    this.state = {
      status: SessionStatus.Running,
      mode,
      currentPhaseIndex: 0,
      remainingTime: firstPhase.duration,
      elapsedSessionTime: 0,
      startedAt: Date.now(),
      pausedAt: null,
      totalPausedTime: 0,
      participantConfig: participantConfig ?? null,
    }
    this.phaseStartElapsed = 0

    // Enable and play start audio
    await this.audioService.enable()
    await this.audioService.play(AudioEvent.SessionStart)

    // Play audio for the first phase start if it's a speaking phase
    // This ensures we have the start gong at the beginning of the first speaking phase
    this.playPhaseStartAudio(firstPhase.type)

    // Start timer
    const timerCallback: TimerCallback = {
      onTick: (elapsedSeconds) => this.handleTick(elapsedSeconds),
    }
    this.timerService.start(timerCallback)

    this.notifyStateChange()
    return true
  }

  /**
   * Pause the session
   */
  pause(): void {
    if (this.state.status !== SessionStatus.Running) return

    this.timerService.pause()
    this.state = {
      ...this.state,
      status: SessionStatus.Paused,
      pausedAt: Date.now(),
    }

    this.notifyStateChange()
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (this.state.status !== SessionStatus.Paused) return

    // Calculate pause duration
    const pauseDuration = this.state.pausedAt ? Date.now() - this.state.pausedAt : 0

    this.timerService.resume()
    this.state = {
      ...this.state,
      status: SessionStatus.Running,
      pausedAt: null,
      totalPausedTime: this.state.totalPausedTime + pauseDuration,
    }

    this.notifyStateChange()
  }

  /**
   * Stop the session completely
   */
  stop(): void {
    this.timerService.stop()
    this.state = createInitialState()
    this.phaseStartElapsed = 0
    this.notifyStateChange()
  }

  /**
   * Handle timer tick - update remaining time and check for phase transitions
   * Loops through multiple phase completions if a single tick spans multiple phases
   */
  private handleTick(elapsedSeconds: number): void {
    if (this.state.status !== SessionStatus.Running || !this.state.mode) return

    // Loop to handle multiple phase transitions in a single tick
    while (this.state.status === SessionStatus.Running && this.state.mode) {
      const currentPhase = getCurrentPhase(this.state)
      if (!currentPhase) break

      // Calculate remaining time in current phase
      const phaseElapsed = elapsedSeconds - this.phaseStartElapsed
      const remaining = Math.max(0, currentPhase.duration - phaseElapsed)

      // Update state
      this.state = {
        ...this.state,
        remainingTime: remaining,
        elapsedSessionTime: elapsedSeconds,
      }

      // Check for phase completion
      if (remaining <= 0) {
        this.transitionToNextPhase(elapsedSeconds)
        // Continue loop to check if next phase also completed
      } else {
        // Phase still running, exit loop
        break
      }
    }

    this.notifyStateChange()
  }

  /**
   * Transition to the next phase (synchronous state update, async audio)
   */
  private transitionToNextPhase(currentElapsed: number): void {
    if (!this.state.mode) return

    const currentPhase = getCurrentPhase(this.state)

    // Play appropriate audio for phase end (fire-and-forget)
    if (currentPhase) {
      this.playPhaseEndAudio(currentPhase.type)
    }

    // Check if this was the last phase
    if (isLastPhase(this.state)) {
      this.finishSession()
      return
    }

    // Move to next phase
    const nextIndex = this.state.currentPhaseIndex + 1
    const nextPhase = this.state.mode.phases[nextIndex]

    // Calculate how much time has elapsed into the next phase
    const timeIntoNextPhase = currentElapsed - this.phaseStartElapsed - currentPhase!.duration

    // Update phaseStartElapsed to when this phase started
    this.phaseStartElapsed = this.phaseStartElapsed + currentPhase!.duration

    // Play audio for next phase start if applicable (fire-and-forget)
    this.playPhaseStartAudio(nextPhase.type)

    // Update state for next phase
    this.state = {
      ...this.state,
      currentPhaseIndex: nextIndex,
      remainingTime: Math.max(0, nextPhase.duration - timeIntoNextPhase),
    }
  }

  /**
   * Play audio when a phase ends
   */
  private async playPhaseEndAudio(phaseType: PhaseType): Promise<void> {
    switch (phaseType) {
      case PhaseType.SlotA:
      case PhaseType.SlotB:
        await this.audioService.play(AudioEvent.SlotEnd)
        break
      case PhaseType.Transition:
        await this.audioService.play(AudioEvent.TransitionEnd)
        break
      case PhaseType.ClosingA:
      case PhaseType.ClosingB:
        // No specific end audio for closing
        break
    }
  }

  /**
   * Play audio when a phase starts
   */
  private async playPhaseStartAudio(phaseType: PhaseType): Promise<void> {
    switch (phaseType) {
      case PhaseType.SlotA:
      case PhaseType.SlotB:
        // Play start gong for speaking slots - important for marking the transition from prep to speaking
        await this.audioService.play(AudioEvent.SlotStart)
        break
      case PhaseType.ClosingA:
        await this.audioService.play(AudioEvent.ClosingStart)
        break
      case PhaseType.Cooldown:
        await this.audioService.play(AudioEvent.CooldownStart)
        break
    }
  }

  /**
   * Finish the session (synchronous state update, async audio)
   */
  private finishSession(): void {
    this.timerService.stop()

    // Play cooldown end audio (fire-and-forget)
    this.audioService.play(AudioEvent.CooldownEnd)

    this.state = {
      ...this.state,
      status: SessionStatus.Finished,
      remainingTime: 0,
    }

    this.notifyStateChange()
  }

  /**
   * Notify subscribers of state change
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  /**
   * Get current guidance tips (if applicable)
   */
  getTips(): string[] {
    const currentPhase = getCurrentPhase(this.state)
    if (!currentPhase || !this.state.mode) return []

    return this.guidanceService.getTipsForPhase(
      currentPhase.type,
      this.state.mode.guidanceLevel
    )
  }

  /**
   * Get a random tip for current phase
   */
  getRandomTip(): string | null {
    const currentPhase = getCurrentPhase(this.state)
    if (!currentPhase || !this.state.mode) return null

    return this.guidanceService.getRandomTip(
      currentPhase.type,
      this.state.mode.guidanceLevel
    )
  }
}

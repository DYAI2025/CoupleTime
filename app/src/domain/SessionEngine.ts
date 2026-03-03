/**
 * SessionEngine – authoritative state machine.
 *
 * TIMER ACCURACY:
 * Uses absolute elapsed time from TimerService (performance.now-based).
 * remainingTime = phase.duration - (elapsedNow - phaseStartElapsed)
 * NO incremental -= drift. Handles missed ticks and multi-phase skips.
 */

import type { SessionMode } from './SessionMode'
import type { PhaseConfig } from './PhaseConfig'
import { getTimerService, type TimerServiceProtocol } from '@/services/TimerService'
import { getAudioService, type AudioServiceProtocol, type AudioEvent } from '@/services/AudioService'

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface SessionState {
  status: SessionStatus
  mode: SessionMode | null
  currentPhaseIndex: number
  remainingTime: number       // seconds, accurate
  elapsedSessionTime: number  // seconds
  startedAt: number | null    // Date.now()
  pausedAt: number | null
  totalPausedTime: number     // ms
}

export type SessionEngineEvent =
  | { type: 'stateChanged'; state: SessionState }

export type SessionEngineListener = (event: SessionEngineEvent) => void

function createInitialState(): SessionState {
  return {
    status: 'idle',
    mode: null,
    currentPhaseIndex: 0,
    remainingTime: 0,
    elapsedSessionTime: 0,
    startedAt: null,
    pausedAt: null,
    totalPausedTime: 0,
  }
}

export class SessionEngine {
  private state: SessionState = createInitialState()
  private timer: TimerServiceProtocol
  private audio: AudioServiceProtocol
  private listeners = new Set<SessionEngineListener>()

  /** Absolute elapsed seconds at the start of the current phase */
  private phaseStartElapsed = 0

  constructor(
    timer: TimerServiceProtocol = getTimerService(),
    audio: AudioServiceProtocol = getAudioService(),
  ) {
    this.timer = timer
    this.audio = audio
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async start(mode: SessionMode): Promise<void> {
    if (this.state.status !== 'idle' && this.state.status !== 'finished') {
      this.timer.stop()
    }

    await this.audio.enable()
    await this.audio.play('sessionStart')

    const firstPhase = mode.phases[0]
    this.phaseStartElapsed = 0
    this.state = {
      status: 'running',
      mode,
      currentPhaseIndex: 0,
      remainingTime: firstPhase.duration,
      elapsedSessionTime: 0,
      startedAt: Date.now(),
      pausedAt: null,
      totalPausedTime: 0,
    }

    this._playPhaseStart(firstPhase.type)
    this.timer.start({ onTick: (s) => this._handleTick(s) })
    this._emit()
  }

  pause(): void {
    if (this.state.status !== 'running') return
    this.timer.pause()
    this.state = { ...this.state, status: 'paused', pausedAt: Date.now() }
    this._emit()
  }

  resume(): void {
    if (this.state.status !== 'paused') return
    const pauseDuration = this.state.pausedAt ? Date.now() - this.state.pausedAt : 0
    this.timer.resume()
    this.state = {
      ...this.state,
      status: 'running',
      pausedAt: null,
      totalPausedTime: this.state.totalPausedTime + pauseDuration,
    }
    this._emit()
  }

  stop(): void {
    this.timer.stop()
    this.state = createInitialState()
    this.phaseStartElapsed = 0
    this._emit()
  }

  subscribe(listener: SessionEngineListener): () => void {
    this.listeners.add(listener)
    listener({ type: 'stateChanged', state: { ...this.state } })
    return () => this.listeners.delete(listener)
  }

  getState(): SessionState { return { ...this.state } }
  getMode(): SessionMode | null { return this.state.mode }

  getCurrentPhase(): PhaseConfig | null {
    if (!this.state.mode) return null
    const { mode, currentPhaseIndex } = this.state
    if (currentPhaseIndex >= mode.phases.length) return null
    return mode.phases[currentPhaseIndex]
  }

  // ── Timer tick – ACCURATE absolute calculation ────────────────────────────

  private _handleTick(elapsedSeconds: number): void {
    if (this.state.status !== 'running' || !this.state.mode) return

    // Loop handles case where a single tick spans multiple short phases
    while (this.state.status === 'running' && this.state.mode) {
      const phase = this._currentPhase()
      if (!phase) break

      const phaseElapsed = elapsedSeconds - this.phaseStartElapsed
      const remaining = Math.max(0, phase.duration - phaseElapsed)

      this.state = {
        ...this.state,
        remainingTime: remaining,
        elapsedSessionTime: elapsedSeconds,
      }

      if (remaining <= 0) {
        this._transitionToNext(elapsedSeconds)
      } else {
        break
      }
    }

    this._emit()
  }

  private _transitionToNext(elapsedSeconds: number): void {
    const mode = this.state.mode
    if (!mode) return

    const current = this._currentPhase()
    if (current) this._playPhaseEnd(current.type)

    const isLast = this.state.currentPhaseIndex >= mode.phases.length - 1
    if (isLast) {
      this._finish()
      return
    }

    const nextIndex = this.state.currentPhaseIndex + 1
    const nextPhase = mode.phases[nextIndex]

    // Advance phaseStartElapsed to the exact moment this phase started
    this.phaseStartElapsed += current!.duration
    const timeIntoNext = elapsedSeconds - this.phaseStartElapsed

    this._playPhaseStart(nextPhase.type)
    this.state = {
      ...this.state,
      currentPhaseIndex: nextIndex,
      remainingTime: Math.max(0, nextPhase.duration - timeIntoNext),
    }
  }

  private _finish(): void {
    this.timer.stop()
    this.audio.play('cooldownEnd')
    this.state = { ...this.state, status: 'finished', remainingTime: 0 }
  }

  // ── Audio helpers ─────────────────────────────────────────────────────────

  private _playPhaseStart(type: string): void {
    const map: Record<string, AudioEvent> = {
      slotA: 'slotStart', slotB: 'slotStart',
      closingA: 'closingStart', closingB: 'closingStart',
      cooldown: 'cooldownStart',
    }
    const ev = map[type]
    if (ev) this.audio.play(ev)
  }

  private _playPhaseEnd(type: string): void {
    const map: Record<string, AudioEvent> = {
      slotA: 'slotEnd', slotB: 'slotEnd',
      transition: 'transitionEnd',
    }
    const ev = map[type]
    if (ev) this.audio.play(ev)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _currentPhase(): PhaseConfig | null {
    return this.getCurrentPhase()
  }

  private _emit(): void {
    const s = { ...this.state }
    this.listeners.forEach(l => {
      try { l({ type: 'stateChanged', state: s }) } catch { /* */ }
    })
  }
}

// Singleton
let _engine: SessionEngine | null = null
export function getSessionEngine(): SessionEngine {
  if (!_engine) _engine = new SessionEngine()
  return _engine
}
export function resetSessionEngine(): void {
  if (_engine) { try { _engine.stop() } catch { /* */ } }
  _engine = null
}

/**
 * SessionEngine – drift-free state machine.
 * remainingTime = phase.duration - (elapsed - phaseStartElapsed)  → NO incremental drift.
 */

import type { SessionMode } from './SessionMode'
import type { PhaseConfig } from './PhaseConfig'
import { getTotalDuration } from './SessionMode'
import { getTimerService, type TimerServiceProtocol } from '@/services/TimerService'
import { getAudioService, type AudioServiceProtocol, type AudioEvent } from '@/services/AudioService'

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface SessionState {
  status: SessionStatus
  mode: SessionMode | null
  currentPhaseIndex: number
  remainingTime: number       // seconds
  elapsedSessionTime: number  // seconds
  startedAt: number | null    // Date.now()
  pausedAt: number | null
  totalPausedTime: number     // ms
}

export type SessionEngineEvent = { type: 'stateChanged'; state: SessionState }
export type SessionEngineListener = (event: SessionEngineEvent) => void

function initial(): SessionState {
  return {
    status: 'idle', mode: null, currentPhaseIndex: 0,
    remainingTime: 0, elapsedSessionTime: 0,
    startedAt: null, pausedAt: null, totalPausedTime: 0,
  }
}

// ── Persistence (survive tab reload) ─────────────────────────────────────────
const LS_KEY = 'ct.v1.session-state'

function saveState(s: SessionState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* */ }
}

function loadState(): SessionState | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SessionState
    if (!s || !s.status) return null
    // Only restore if recent & not finished
    if (s.status === 'finished' || s.status === 'idle') return null
    if (!s.startedAt) return null
    const age = Date.now() - s.startedAt
    if (age > 3600_000) return null  // > 1h old → discard
    return s
  } catch { return null }
}

function clearState() {
  try { localStorage.removeItem(LS_KEY) } catch { /* */ }
}

// ── Engine ────────────────────────────────────────────────────────────────────

export class SessionEngine {
  private state: SessionState = initial()
  private timer: TimerServiceProtocol
  private audio: AudioServiceProtocol
  private listeners = new Set<SessionEngineListener>()
  private phaseStartElapsed = 0

  constructor(
    timer: TimerServiceProtocol = getTimerService(),
    audio: AudioServiceProtocol = getAudioService(),
  ) {
    this.timer = timer
    this.audio = audio
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async start(mode: SessionMode): Promise<void> {
    if (this.state.status === 'running' || this.state.status === 'paused') this.timer.stop()
    clearState()

    await this.audio.enable()
    await this.audio.play('sessionStart')

    const first = mode.phases[0]
    this.phaseStartElapsed = 0
    this.state = {
      status: 'running', mode,
      currentPhaseIndex: 0,
      remainingTime: first.duration,
      elapsedSessionTime: 0,
      startedAt: Date.now(),
      pausedAt: null, totalPausedTime: 0,
    }
    this._playPhaseStart(first)
    this.timer.start({ onTick: s => this._handleTick(s) })
    saveState(this.state)
    this._emit()
  }

  /** Restore a previously saved session (e.g. after page reload) */
  restoreFromState(saved: SessionState): boolean {
    if (!saved.mode || !saved.startedAt) return false
    const phase = saved.mode.phases[saved.currentPhaseIndex]
    if (!phase) return false

    // Recalculate remaining based on wall-clock time elapsed since pause/start
    const elapsed = saved.status === 'paused'
      ? (saved.pausedAt ?? saved.startedAt) - saved.startedAt - saved.totalPausedTime
      : Date.now() - saved.startedAt - saved.totalPausedTime

    // Find which phase we should be in
    let elapsedSec = elapsed / 1000
    let idx = 0
    let phaseStart = 0
    const phases = saved.mode.phases
    for (let i = 0; i < phases.length; i++) {
      if (elapsedSec < phases[i].duration) { idx = i; break }
      elapsedSec -= phases[i].duration
      phaseStart += phases[i].duration
      idx = i + 1
    }
    idx = Math.min(idx, phases.length - 1)
    const remaining = Math.max(0, phases[idx].duration - elapsedSec)

    this.phaseStartElapsed = phaseStart
    this.state = {
      ...saved,
      currentPhaseIndex: idx,
      remainingTime: remaining,
      elapsedSessionTime: elapsed / 1000,
    }

    if (this.state.status === 'running') {
      this.timer.start({ onTick: s => this._handleTick(s) })
    }
    this._emit()
    return true
  }

  pause(): void {
    if (this.state.status !== 'running') return
    this.timer.pause()
    this.state = { ...this.state, status: 'paused', pausedAt: Date.now() }
    saveState(this.state)
    this._emit()
  }

  resume(): void {
    if (this.state.status !== 'paused') return
    const pauseDur = this.state.pausedAt ? Date.now() - this.state.pausedAt : 0
    this.timer.resume()
    this.state = {
      ...this.state, status: 'running', pausedAt: null,
      totalPausedTime: this.state.totalPausedTime + pauseDur,
    }
    saveState(this.state)
    this._emit()
  }

  stop(): void {
    this.timer.stop()
    clearState()
    this.state = initial()
    this.phaseStartElapsed = 0
    this._emit()
  }

  subscribe(l: SessionEngineListener): () => void {
    this.listeners.add(l)
    l({ type: 'stateChanged', state: { ...this.state } })
    return () => this.listeners.delete(l)
  }

  getState(): SessionState { return { ...this.state } }
  getMode(): SessionMode | null { return this.state.mode }

  getCurrentPhase(): PhaseConfig | null {
    if (!this.state.mode) return null
    return this.state.mode.phases[this.state.currentPhaseIndex] ?? null
  }

  getTotalDuration(): number {
    return this.state.mode ? getTotalDuration(this.state.mode) : 0
  }

  // ── Tick ────────────────────────────────────────────────────────────────────

  private _handleTick(elapsedSeconds: number): void {
    if (this.state.status !== 'running' || !this.state.mode) return

    while (this.state.status === 'running' && this.state.mode) {
      const phase = this.getCurrentPhase()
      if (!phase) break
      const phaseElapsed = elapsedSeconds - this.phaseStartElapsed
      const remaining    = Math.max(0, phase.duration - phaseElapsed)
      this.state = { ...this.state, remainingTime: remaining, elapsedSessionTime: elapsedSeconds }

      if (remaining <= 0) {
        this._transition(elapsedSeconds)
      } else { break }
    }
    saveState(this.state)
    this._emit()
  }

  private _transition(elapsedSeconds: number): void {
    const mode = this.state.mode!
    const current = this.getCurrentPhase()
    if (current) this._playPhaseEnd(current)

    const isLast = this.state.currentPhaseIndex >= mode.phases.length - 1
    if (isLast) { this._finish(); return }

    this.phaseStartElapsed += current!.duration
    const nextIdx = this.state.currentPhaseIndex + 1
    const nextPhase = mode.phases[nextIdx]
    const timeIntoNext = elapsedSeconds - this.phaseStartElapsed

    this._playPhaseStart(nextPhase)
    this.state = {
      ...this.state,
      currentPhaseIndex: nextIdx,
      remainingTime: Math.max(0, nextPhase.duration - timeIntoNext),
    }
  }

  private _finish(): void {
    this.timer.stop()
    this.audio.play('cooldownEnd')
    clearState()
    this.state = { ...this.state, status: 'finished', remainingTime: 0 }
  }

  // ── Audio ───────────────────────────────────────────────────────────────────

  private _playPhaseStart(phase: PhaseConfig) {
    // Custom sound type has priority
    if (phase.soundType) { this.audio.playSound(phase.soundType); return }
    const map: Record<string, AudioEvent> = {
      slotA: 'slotStart', slotB: 'slotStart',
      closingA: 'closingStart', closingB: 'closingStart',
      cooldown: 'cooldownStart',
    }
    const ev = map[phase.type]
    if (ev) this.audio.play(ev)
  }

  private _playPhaseEnd(phase: PhaseConfig) {
    const map: Record<string, AudioEvent> = {
      slotA: 'slotEnd', slotB: 'slotEnd',
      transition: 'transitionEnd',
    }
    const ev = map[phase.type]
    if (ev) this.audio.play(ev)
  }

  private _emit() {
    const s = { ...this.state }
    this.listeners.forEach(l => { try { l({ type: 'stateChanged', state: s }) } catch { /* */ } })
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
export { loadState as loadSavedSessionState, clearState as clearSavedSessionState }

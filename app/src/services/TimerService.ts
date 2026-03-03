/**
 * High-accuracy timer – uses performance.now() for drift correction.
 * Remaining time = phase.duration - (elapsedNow - phaseStartElapsed)
 * ➜ NO incremental subtraction, NO drift accumulation.
 * Target: < 1 second drift per 30 minutes.
 */

export interface TimerCallback {
  onTick: (elapsedSeconds: number) => void
}

export interface TimerServiceProtocol {
  start(callback: TimerCallback): void
  pause(): void
  resume(): void
  stop(): void
  isRunning(): boolean
  getElapsedSeconds(): number
}

class TimerServiceImpl implements TimerServiceProtocol {
  private running = false
  private paused = false
  private startTime = 0           // performance.now() when started
  private pauseTime = 0           // performance.now() when paused
  private totalPausedMs = 0       // accumulated pause duration
  private callback: TimerCallback | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly TICK_MS = 100  // 10 ticks/second → smooth UI

  start(callback: TimerCallback): void {
    if (this.running) this.stop()
    this.callback = callback
    this.startTime = performance.now()
    this.pauseTime = 0
    this.totalPausedMs = 0
    this.running = true
    this.paused = false
    this._startInterval()
  }

  pause(): void {
    if (!this.running || this.paused) return
    this.paused = true
    this.pauseTime = performance.now()
    this._stopInterval()
  }

  resume(): void {
    if (!this.running || !this.paused) return
    this.totalPausedMs += performance.now() - this.pauseTime
    this.paused = false
    this.pauseTime = 0
    this._startInterval()
  }

  stop(): void {
    this._stopInterval()
    this.running = false
    this.paused = false
    this.startTime = 0
    this.totalPausedMs = 0
    this.callback = null
  }

  isRunning(): boolean {
    return this.running && !this.paused
  }

  getElapsedSeconds(): number {
    if (!this.running) return 0
    const now = this.paused ? this.pauseTime : performance.now()
    return Math.max(0, (now - this.startTime - this.totalPausedMs) / 1000)
  }

  private _startInterval(): void {
    this._stopInterval()
    // Immediate first tick
    this._tick()
    this.intervalId = setInterval(() => this._tick(), this.TICK_MS)
  }

  private _stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private _tick(): void {
    if (!this.callback || !this.running || this.paused) return
    this.callback.onTick(this.getElapsedSeconds())
  }
}

// Singleton
export const TimerService: TimerServiceProtocol = new TimerServiceImpl()

export function getTimerService(): TimerServiceProtocol {
  return TimerService
}

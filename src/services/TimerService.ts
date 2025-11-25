/**
 * High-accuracy timer service using performance.now() for drift correction
 * Target: ±1 second drift per 30 minutes
 */

export interface TimerCallback {
  /** Called on each tick with elapsed seconds since start */
  onTick: (elapsedSeconds: number) => void
  /** Called when timer completes target duration */
  onComplete?: () => void
}

export interface TimerServiceProtocol {
  /** Start the timer */
  start(callback: TimerCallback, targetDuration?: number): void
  /** Pause the timer */
  pause(): void
  /** Resume from pause */
  resume(): void
  /** Stop and reset the timer */
  stop(): void
  /** Check if timer is running */
  isRunning(): boolean
  /** Check if timer is paused */
  isPaused(): boolean
  /** Get current elapsed time in seconds */
  getElapsedSeconds(): number
  /** Set tick interval in ms (default 100ms for smooth UI) */
  setTickInterval(ms: number): void
}

class TimerServiceImpl implements TimerServiceProtocol {
  private running = false
  private paused = false
  private startTime: number = 0 // performance.now() timestamp
  private pauseTime: number = 0 // performance.now() when paused
  private totalPausedMs: number = 0 // accumulated pause time
  private targetDurationMs: number | null = null
  private callback: TimerCallback | null = null
  private intervalId: number | null = null
  private tickIntervalMs: number = 100 // 10 ticks per second for smooth UI

  start(callback: TimerCallback, targetDurationSeconds?: number): void {
    if (this.running) {
      this.stop()
    }

    this.callback = callback
    this.startTime = performance.now()
    this.pauseTime = 0
    this.totalPausedMs = 0
    this.targetDurationMs = targetDurationSeconds ? targetDurationSeconds * 1000 : null
    this.running = true
    this.paused = false

    this.startInterval()
  }

  pause(): void {
    if (!this.running || this.paused) return

    this.paused = true
    this.pauseTime = performance.now()
    this.stopInterval()
  }

  resume(): void {
    if (!this.running || !this.paused) return

    // Calculate how long we were paused
    const pauseDuration = performance.now() - this.pauseTime
    this.totalPausedMs += pauseDuration

    this.paused = false
    this.pauseTime = 0

    this.startInterval()
  }

  stop(): void {
    this.stopInterval()
    this.running = false
    this.paused = false
    this.startTime = 0
    this.pauseTime = 0
    this.totalPausedMs = 0
    this.targetDurationMs = null
    this.callback = null
  }

  isRunning(): boolean {
    return this.running && !this.paused
  }

  isPaused(): boolean {
    return this.running && this.paused
  }

  getElapsedSeconds(): number {
    if (!this.running) return 0

    let currentTime: number
    if (this.paused) {
      currentTime = this.pauseTime
    } else {
      currentTime = performance.now()
    }

    const elapsedMs = currentTime - this.startTime - this.totalPausedMs
    return Math.max(0, elapsedMs / 1000)
  }

  setTickInterval(ms: number): void {
    this.tickIntervalMs = Math.max(16, ms) // Minimum ~60fps

    // Restart interval if running
    if (this.isRunning()) {
      this.stopInterval()
      this.startInterval()
    }
  }

  private startInterval(): void {
    this.stopInterval()

    this.intervalId = window.setInterval(() => {
      this.tick()
    }, this.tickIntervalMs)

    // Immediate first tick
    this.tick()
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick(): void {
    if (!this.callback || !this.running || this.paused) return

    const elapsedSeconds = this.getElapsedSeconds()
    this.callback.onTick(elapsedSeconds)

    // Check for completion
    if (this.targetDurationMs !== null) {
      const elapsedMs = elapsedSeconds * 1000
      if (elapsedMs >= this.targetDurationMs) {
        this.callback.onComplete?.()
        this.stop()
      }
    }
  }
}

// Singleton instance
export const TimerService: TimerServiceProtocol = new TimerServiceImpl()

/**
 * Create a mock timer service for testing
 */
export function createMockTimerService(): TimerServiceProtocol & {
  simulateTick: (elapsedSeconds: number) => void
  simulateComplete: () => void
  getCallback: () => TimerCallback | null
} {
  let running = false
  let paused = false
  let elapsedSeconds = 0
  let callback: TimerCallback | null = null

  return {
    start(cb: TimerCallback, _targetDuration?: number) {
      callback = cb
      running = true
      paused = false
      elapsedSeconds = 0
    },
    pause() {
      if (running) paused = true
    },
    resume() {
      if (running) paused = false
    },
    stop() {
      running = false
      paused = false
      elapsedSeconds = 0
      callback = null
    },
    isRunning() {
      return running && !paused
    },
    isPaused() {
      return running && paused
    },
    getElapsedSeconds() {
      return elapsedSeconds
    },
    setTickInterval(_ms: number) {
      // Mock implementation - no-op
    },
    // Test helpers
    simulateTick(seconds: number) {
      elapsedSeconds = seconds
      if (callback && running && !paused) {
        callback.onTick(seconds)
      }
    },
    simulateComplete() {
      if (callback && running) {
        callback.onComplete?.()
      }
    },
    getCallback() {
      return callback
    },
  }
}

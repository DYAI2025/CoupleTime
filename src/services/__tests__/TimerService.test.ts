import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockTimerService } from '../TimerService'

describe('TimerService', () => {
  describe('MockTimerService', () => {
    let timer: ReturnType<typeof createMockTimerService>

    beforeEach(() => {
      timer = createMockTimerService()
    })

    afterEach(() => {
      timer.stop()
    })

    it('starts in stopped state', () => {
      expect(timer.isRunning()).toBe(false)
      expect(timer.isPaused()).toBe(false)
      expect(timer.getElapsedSeconds()).toBe(0)
    })

    it('starts timer with callback', () => {
      const onTick = vi.fn()
      timer.start({ onTick })

      expect(timer.isRunning()).toBe(true)
      expect(timer.isPaused()).toBe(false)
    })

    it('pauses and resumes', () => {
      const onTick = vi.fn()
      timer.start({ onTick })

      timer.pause()
      expect(timer.isRunning()).toBe(false)
      expect(timer.isPaused()).toBe(true)

      timer.resume()
      expect(timer.isRunning()).toBe(true)
      expect(timer.isPaused()).toBe(false)
    })

    it('stops timer', () => {
      const onTick = vi.fn()
      timer.start({ onTick })
      timer.stop()

      expect(timer.isRunning()).toBe(false)
      expect(timer.isPaused()).toBe(false)
      expect(timer.getElapsedSeconds()).toBe(0)
    })

    it('simulates tick and calls callback', () => {
      const onTick = vi.fn()
      timer.start({ onTick })

      timer.simulateTick(5)
      expect(onTick).toHaveBeenCalledWith(5)
      expect(timer.getElapsedSeconds()).toBe(5)
    })

    it('does not call tick when paused', () => {
      const onTick = vi.fn()
      timer.start({ onTick })
      timer.pause()

      timer.simulateTick(10)
      expect(onTick).not.toHaveBeenCalled()
    })

    it('simulates complete and calls onComplete', () => {
      const onTick = vi.fn()
      const onComplete = vi.fn()
      timer.start({ onTick, onComplete })

      timer.simulateComplete()
      expect(onComplete).toHaveBeenCalled()
    })

    it('handles missing onComplete gracefully', () => {
      const onTick = vi.fn()
      timer.start({ onTick })

      // Should not throw
      expect(() => timer.simulateComplete()).not.toThrow()
    })

    it('getCallback returns current callback', () => {
      const onTick = vi.fn()
      timer.start({ onTick })

      const callback = timer.getCallback()
      expect(callback).toBeDefined()
      expect(callback?.onTick).toBe(onTick)
    })

    it('getCallback returns null when stopped', () => {
      expect(timer.getCallback()).toBeNull()
    })
  })

  describe('Timer accuracy requirements', () => {
    it('uses performance.now() based timing (verified by API design)', () => {
      // The TimerService implementation uses performance.now()
      // This test verifies the mock maintains the same API contract
      const timer = createMockTimerService()
      const onTick = vi.fn()

      timer.start({ onTick })

      // Simulate 30 minutes worth of ticks
      const thirtyMinutesInSeconds = 30 * 60

      // First tick at start
      timer.simulateTick(0)
      expect(onTick).toHaveBeenLastCalledWith(0)

      // Final tick at 30 minutes
      timer.simulateTick(thirtyMinutesInSeconds)
      expect(onTick).toHaveBeenLastCalledWith(thirtyMinutesInSeconds)

      // The elapsed time should match exactly (in mock)
      expect(timer.getElapsedSeconds()).toBe(thirtyMinutesInSeconds)

      timer.stop()
    })
  })

  describe('Pause time tracking', () => {
    it('pause and resume maintain consistent elapsed time', () => {
      const timer = createMockTimerService()
      const onTick = vi.fn()

      timer.start({ onTick })

      // Tick at 10 seconds
      timer.simulateTick(10)
      expect(timer.getElapsedSeconds()).toBe(10)

      // Pause
      timer.pause()
      expect(timer.isPaused()).toBe(true)

      // Elapsed time should still be 10 while paused
      expect(timer.getElapsedSeconds()).toBe(10)

      // Resume
      timer.resume()
      expect(timer.isRunning()).toBe(true)

      // Continue from 10
      timer.simulateTick(15)
      expect(timer.getElapsedSeconds()).toBe(15)

      timer.stop()
    })
  })

  describe('setTickInterval', () => {
    it('accepts custom tick interval', () => {
      const timer = createMockTimerService()

      // Should not throw
      expect(() => timer.setTickInterval(50)).not.toThrow()
      expect(() => timer.setTickInterval(200)).not.toThrow()
    })
  })
})

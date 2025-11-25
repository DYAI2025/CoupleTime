import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionEngine } from '../SessionEngine'
import { SessionStatus } from '../SessionState'
import { MAINTAIN_MODE, COMMITMENT_MODE } from '../SessionMode.presets'
import { createMockAudioService } from '../../services/AudioService'
import { createMockTimerService } from '../../services/TimerService'
import { createMockGuidanceService } from '../../services/GuidanceService'
import { AudioEvent } from '../AudioEvent'

describe('SessionEngine - Core', () => {
  let engine: SessionEngine
  let audioService: ReturnType<typeof createMockAudioService>
  let timerService: ReturnType<typeof createMockTimerService>
  let guidanceService: ReturnType<typeof createMockGuidanceService>

  beforeEach(() => {
    audioService = createMockAudioService()
    timerService = createMockTimerService()
    guidanceService = createMockGuidanceService()
    engine = new SessionEngine(audioService, timerService, guidanceService)
  })

  describe('Initial State', () => {
    it('starts in idle state', () => {
      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Idle)
    })

    it('has no mode initially', () => {
      const state = engine.getState()
      expect(state.mode).toBeNull()
    })

    it('has zero elapsed time initially', () => {
      const state = engine.getState()
      expect(state.elapsedSessionTime).toBe(0)
    })

    it('has zero remaining time initially', () => {
      const state = engine.getState()
      expect(state.remainingTime).toBe(0)
    })
  })

  describe('start()', () => {
    it('starts a session with valid mode', async () => {
      const result = await engine.start(MAINTAIN_MODE)
      expect(result).toBe(true)
    })

    it('sets status to running', async () => {
      await engine.start(MAINTAIN_MODE)
      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Running)
    })

    it('stores the mode', async () => {
      await engine.start(MAINTAIN_MODE)
      const state = engine.getState()
      expect(state.mode).toBe(MAINTAIN_MODE)
    })

    it('starts at first phase', async () => {
      await engine.start(MAINTAIN_MODE)
      const state = engine.getState()
      expect(state.currentPhaseIndex).toBe(0)
    })

    it('sets remaining time to first phase duration', async () => {
      await engine.start(MAINTAIN_MODE)
      const state = engine.getState()
      expect(state.remainingTime).toBe(MAINTAIN_MODE.phases[0].duration)
    })

    it('records start time', async () => {
      const beforeStart = Date.now()
      await engine.start(MAINTAIN_MODE)
      const afterStart = Date.now()

      const state = engine.getState()
      expect(state.startedAt).toBeGreaterThanOrEqual(beforeStart)
      expect(state.startedAt).toBeLessThanOrEqual(afterStart)
    })

    it('enables audio service', async () => {
      await engine.start(MAINTAIN_MODE)
      expect(audioService.isEnabled()).toBe(true)
    })

    it('plays session start audio', async () => {
      await engine.start(MAINTAIN_MODE)
      expect(audioService.playedEvents).toContain(AudioEvent.SessionStart)
    })

    it('starts the timer service', async () => {
      await engine.start(MAINTAIN_MODE)
      expect(timerService.isRunning()).toBe(true)
    })

    it('rejects invalid mode', async () => {
      const invalidMode = { ...MAINTAIN_MODE, phases: [] }
      const result = await engine.start(invalidMode)
      expect(result).toBe(false)
    })

    it('stops existing session before starting new one', async () => {
      await engine.start(MAINTAIN_MODE)
      await engine.start(COMMITMENT_MODE)

      const state = engine.getState()
      expect(state.mode).toBe(COMMITMENT_MODE)
      expect(state.currentPhaseIndex).toBe(0)
    })
  })

  describe('pause()', () => {
    beforeEach(async () => {
      await engine.start(MAINTAIN_MODE)
    })

    it('pauses a running session', () => {
      engine.pause()
      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Paused)
    })

    it('records pause time', () => {
      const beforePause = Date.now()
      engine.pause()
      const afterPause = Date.now()

      const state = engine.getState()
      expect(state.pausedAt).toBeGreaterThanOrEqual(beforePause)
      expect(state.pausedAt).toBeLessThanOrEqual(afterPause)
    })

    it('pauses the timer service', () => {
      engine.pause()
      expect(timerService.isPaused()).toBe(true)
    })

    it('does nothing if already paused', () => {
      engine.pause()
      const firstPauseTime = engine.getState().pausedAt

      engine.pause()
      const secondPauseTime = engine.getState().pausedAt

      expect(secondPauseTime).toBe(firstPauseTime)
    })

    it('does nothing if idle', () => {
      engine.stop()
      engine.pause()

      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Idle)
    })
  })

  describe('resume()', () => {
    beforeEach(async () => {
      await engine.start(MAINTAIN_MODE)
      engine.pause()
    })

    it('resumes a paused session', () => {
      engine.resume()
      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Running)
    })

    it('clears pause time', () => {
      engine.resume()
      const state = engine.getState()
      expect(state.pausedAt).toBeNull()
    })

    it('tracks total paused time', async () => {
      // Simulate some pause duration
      await new Promise(resolve => setTimeout(resolve, 50))

      engine.resume()
      const state = engine.getState()
      expect(state.totalPausedTime).toBeGreaterThan(0)
    })

    it('resumes the timer service', () => {
      engine.resume()
      expect(timerService.isRunning()).toBe(true)
      expect(timerService.isPaused()).toBe(false)
    })

    it('does nothing if not paused', async () => {
      engine.resume()
      engine.resume() // Second resume should do nothing

      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Running)
    })

    it('does nothing if idle', () => {
      engine.stop()
      engine.resume()

      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Idle)
    })
  })

  describe('stop()', () => {
    beforeEach(async () => {
      await engine.start(MAINTAIN_MODE)
    })

    it('stops a running session', () => {
      engine.stop()
      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Idle)
    })

    it('stops a paused session', () => {
      engine.pause()
      engine.stop()

      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Idle)
    })

    it('resets to initial state', () => {
      engine.stop()
      const state = engine.getState()

      expect(state.mode).toBeNull()
      expect(state.currentPhaseIndex).toBe(0)
      expect(state.remainingTime).toBe(0)
      expect(state.elapsedSessionTime).toBe(0)
    })

    it('stops the timer service', () => {
      engine.stop()
      expect(timerService.isRunning()).toBe(false)
    })
  })

  describe('subscribe()', () => {
    it('notifies subscriber immediately with current state', () => {
      const callback = vi.fn()
      engine.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        status: SessionStatus.Idle
      }))
    })

    it('notifies subscriber on state changes', async () => {
      const callback = vi.fn()
      engine.subscribe(callback)

      await engine.start(MAINTAIN_MODE)

      // Initial call + start call
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('returns unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = engine.subscribe(callback)

      unsubscribe()
      engine.stop()

      // Only initial call, not the stop call
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('notifies on pause', async () => {
      const callback = vi.fn()
      await engine.start(MAINTAIN_MODE)

      engine.subscribe(callback)
      engine.pause()

      expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({
        status: SessionStatus.Paused
      }))
    })

    it('notifies on resume', async () => {
      const callback = vi.fn()
      await engine.start(MAINTAIN_MODE)
      engine.pause()

      engine.subscribe(callback)
      engine.resume()

      expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({
        status: SessionStatus.Running
      }))
    })
  })

  describe('getState()', () => {
    it('returns immutable copy of state', async () => {
      await engine.start(MAINTAIN_MODE)

      const state1 = engine.getState()
      const state2 = engine.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })

    it('modifications to returned state do not affect engine', async () => {
      await engine.start(MAINTAIN_MODE)

      const state = engine.getState()
      state.status = SessionStatus.Finished

      expect(engine.getState().status).toBe(SessionStatus.Running)
    })
  })
})

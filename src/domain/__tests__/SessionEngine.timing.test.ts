import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionEngine } from '../SessionEngine'
import { PhaseType } from '../PhaseType'
import { createCustomMode } from '../SessionMode'
import { createPhaseConfig } from '../PhaseConfig'
import { GuidanceLevel } from '../GuidanceLevel'
import { createMockAudioService } from '../../services/AudioService'
import { createMockTimerService } from '../../services/TimerService'
import { createMockGuidanceService } from '../../services/GuidanceService'

describe('SessionEngine - Time Tracking & Pause Behavior', () => {
  let engine: SessionEngine
  let audioService: ReturnType<typeof createMockAudioService>
  let timerService: ReturnType<typeof createMockTimerService>
  let guidanceService: ReturnType<typeof createMockGuidanceService>

  // Test mode with minimum valid durations
  const testMode = createCustomMode('Test Mode', [
    createPhaseConfig(PhaseType.SlotA, 300),
    createPhaseConfig(PhaseType.SlotB, 300),
    createPhaseConfig(PhaseType.Cooldown, 300),
  ], GuidanceLevel.Minimal)

  beforeEach(() => {
    audioService = createMockAudioService()
    timerService = createMockTimerService()
    guidanceService = createMockGuidanceService()
    engine = new SessionEngine(audioService, timerService, guidanceService)
  })

  describe('Elapsed Time Tracking', () => {
    it('starts with 0 elapsed time', async () => {
      await engine.start(testMode)
      const state = engine.getState()
      expect(state.elapsedSessionTime).toBe(0)
    })

    it('tracks elapsed time through ticks', async () => {
      await engine.start(testMode)

      timerService.simulateTick(30)
      expect(engine.getState().elapsedSessionTime).toBe(30)

      timerService.simulateTick(60)
      expect(engine.getState().elapsedSessionTime).toBe(60)

      timerService.simulateTick(150)
      expect(engine.getState().elapsedSessionTime).toBe(150)
    })

    it('tracks elapsed time across phase transitions', async () => {
      await engine.start(testMode)

      // First phase (300s)
      timerService.simulateTick(300)
      expect(engine.getState().elapsedSessionTime).toBe(300)

      // Second phase (300s)
      timerService.simulateTick(500)
      expect(engine.getState().elapsedSessionTime).toBe(500)

      // Third phase (300s)
      timerService.simulateTick(800)
      expect(engine.getState().elapsedSessionTime).toBe(800)
    })
  })

  describe('Remaining Time Calculation', () => {
    it('starts with first phase duration', async () => {
      await engine.start(testMode)
      expect(engine.getState().remainingTime).toBe(300)
    })

    it('decreases remaining time as phase progresses', async () => {
      await engine.start(testMode)

      timerService.simulateTick(50)
      expect(engine.getState().remainingTime).toBe(250)

      timerService.simulateTick(100)
      expect(engine.getState().remainingTime).toBe(200)

      timerService.simulateTick(200)
      expect(engine.getState().remainingTime).toBe(100)
    })

    it('resets remaining time for new phase', async () => {
      await engine.start(testMode)

      // Complete first phase
      timerService.simulateTick(300)
      expect(engine.getState().remainingTime).toBe(300) // SlotB duration

      // Progress into second phase
      timerService.simulateTick(400)
      expect(engine.getState().remainingTime).toBe(200) // 300 - 100
    })
  })

  describe('Pause Behavior', () => {
    it('pauses timer service when paused', async () => {
      await engine.start(testMode)
      engine.pause()

      expect(timerService.isPaused()).toBe(true)
    })

    it('preserves remaining time when paused', async () => {
      await engine.start(testMode)

      timerService.simulateTick(100)
      const remainingBeforePause = engine.getState().remainingTime

      engine.pause()

      expect(engine.getState().remainingTime).toBe(remainingBeforePause)
    })

    it('preserves current phase when paused', async () => {
      await engine.start(testMode)

      timerService.simulateTick(350) // Into second phase
      const phaseBeforePause = engine.getState().currentPhaseIndex

      engine.pause()

      expect(engine.getState().currentPhaseIndex).toBe(phaseBeforePause)
    })

    it('preserves elapsed time when paused', async () => {
      await engine.start(testMode)

      timerService.simulateTick(150)
      const elapsedBeforePause = engine.getState().elapsedSessionTime

      engine.pause()

      expect(engine.getState().elapsedSessionTime).toBe(elapsedBeforePause)
    })

    it('records pause timestamp', async () => {
      await engine.start(testMode)

      const beforePause = Date.now()
      engine.pause()
      const afterPause = Date.now()

      const pausedAt = engine.getState().pausedAt
      expect(pausedAt).toBeGreaterThanOrEqual(beforePause)
      expect(pausedAt).toBeLessThanOrEqual(afterPause)
    })
  })

  describe('Resume Behavior', () => {
    it('resumes timer service when resumed', async () => {
      await engine.start(testMode)
      engine.pause()

      expect(timerService.isPaused()).toBe(true)

      engine.resume()

      expect(timerService.isRunning()).toBe(true)
      expect(timerService.isPaused()).toBe(false)
    })

    it('clears pause timestamp on resume', async () => {
      await engine.start(testMode)
      engine.pause()

      expect(engine.getState().pausedAt).not.toBeNull()

      engine.resume()

      expect(engine.getState().pausedAt).toBeNull()
    })

    it('continues from where it left off', async () => {
      await engine.start(testMode)

      timerService.simulateTick(100)
      expect(engine.getState().remainingTime).toBe(200)

      engine.pause()
      engine.resume()

      // Simulate continuing from tick 100
      timerService.simulateTick(150)
      expect(engine.getState().remainingTime).toBe(150) // 300 - 150
    })
  })

  describe('Total Paused Time Tracking', () => {
    it('starts with 0 total paused time', async () => {
      await engine.start(testMode)
      expect(engine.getState().totalPausedTime).toBe(0)
    })

    it('accumulates pause duration on resume', async () => {
      await engine.start(testMode)

      engine.pause()
      // Simulate some time passing while paused
      await new Promise(resolve => setTimeout(resolve, 50))
      engine.resume()

      expect(engine.getState().totalPausedTime).toBeGreaterThan(0)
    })

    it('accumulates multiple pauses', async () => {
      await engine.start(testMode)

      // First pause
      engine.pause()
      await new Promise(resolve => setTimeout(resolve, 30))
      engine.resume()
      const afterFirstPause = engine.getState().totalPausedTime

      // Second pause
      engine.pause()
      await new Promise(resolve => setTimeout(resolve, 30))
      engine.resume()
      const afterSecondPause = engine.getState().totalPausedTime

      expect(afterSecondPause).toBeGreaterThan(afterFirstPause)
    })
  })

  describe('State Notification on Timing Events', () => {
    it('notifies on each tick', async () => {
      const callback = vi.fn()
      await engine.start(testMode)
      engine.subscribe(callback)

      timerService.simulateTick(10)
      timerService.simulateTick(20)
      timerService.simulateTick(30)

      // 1 initial + 3 ticks
      expect(callback).toHaveBeenCalledTimes(4)
    })

    it('notifies with updated remaining time', async () => {
      const states: number[] = []
      await engine.start(testMode)

      engine.subscribe((state) => {
        states.push(state.remainingTime)
      })

      timerService.simulateTick(50)
      timerService.simulateTick(100)

      expect(states).toContain(300) // Initial
      expect(states).toContain(250) // After 50s
      expect(states).toContain(200) // After 100s
    })
  })

  describe('Guidance Tips', () => {
    it('returns tips for current phase', async () => {
      const prepMode = createCustomMode('With Prep', [
        createPhaseConfig(PhaseType.Prep, 60),
        createPhaseConfig(PhaseType.SlotA, 300),
        createPhaseConfig(PhaseType.SlotB, 300),
        createPhaseConfig(PhaseType.Cooldown, 300),
      ], GuidanceLevel.High)

      await engine.start(prepMode)

      const tips = engine.getTips()
      expect(tips.length).toBeGreaterThan(0)
    })

    it('returns empty tips for speaking phases', async () => {
      await engine.start(testMode) // Starts with SlotA

      const tips = engine.getTips()
      expect(tips).toHaveLength(0)
    })

    it('returns random tip when available', async () => {
      const cooldownMode = createCustomMode('Cooldown Start', [
        createPhaseConfig(PhaseType.SlotA, 300),
        createPhaseConfig(PhaseType.SlotB, 300),
        createPhaseConfig(PhaseType.Cooldown, 300),
      ], GuidanceLevel.Minimal)

      await engine.start(cooldownMode)
      timerService.simulateTick(600) // Move to cooldown

      const tip = engine.getRandomTip()
      expect(tip).not.toBeNull()
      expect(tip).toContain('guidance.cooldown')
    })
  })

  describe('Session Start Time', () => {
    it('records start timestamp', async () => {
      const beforeStart = Date.now()
      await engine.start(testMode)
      const afterStart = Date.now()

      const startedAt = engine.getState().startedAt
      expect(startedAt).toBeGreaterThanOrEqual(beforeStart)
      expect(startedAt).toBeLessThanOrEqual(afterStart)
    })

    it('preserves start time through pauses', async () => {
      await engine.start(testMode)
      const originalStartTime = engine.getState().startedAt

      engine.pause()
      expect(engine.getState().startedAt).toBe(originalStartTime)

      engine.resume()
      expect(engine.getState().startedAt).toBe(originalStartTime)
    })

    it('preserves start time through phase transitions', async () => {
      await engine.start(testMode)
      const originalStartTime = engine.getState().startedAt

      timerService.simulateTick(300) // Transition to phase 2
      expect(engine.getState().startedAt).toBe(originalStartTime)

      timerService.simulateTick(600) // Transition to phase 3
      expect(engine.getState().startedAt).toBe(originalStartTime)
    })
  })
})

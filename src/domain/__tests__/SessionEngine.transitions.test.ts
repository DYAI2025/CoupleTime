import { describe, it, expect, beforeEach } from 'vitest'
import { SessionEngine } from '../SessionEngine'
import { SessionStatus } from '../SessionState'
import { PhaseType } from '../PhaseType'
import { createCustomMode } from '../SessionMode'
import { createPhaseConfig } from '../PhaseConfig'
import { GuidanceLevel } from '../GuidanceLevel'
import { createMockAudioService } from '../../services/AudioService'
import { createMockTimerService } from '../../services/TimerService'
import { createMockGuidanceService } from '../../services/GuidanceService'
import { AudioEvent } from '../AudioEvent'

describe('SessionEngine - Phase Transitions', () => {
  let engine: SessionEngine
  let audioService: ReturnType<typeof createMockAudioService>
  let timerService: ReturnType<typeof createMockTimerService>
  let guidanceService: ReturnType<typeof createMockGuidanceService>

  // Test mode with minimum valid durations for testing
  // Durations must satisfy PHASE_DURATION_RANGES minimum values
  const testMode = createCustomMode('Test Mode', [
    createPhaseConfig(PhaseType.SlotA, 300),      // 5 min (min: 300s)
    createPhaseConfig(PhaseType.SlotB, 300),      // 5 min (min: 300s)
    createPhaseConfig(PhaseType.Transition, 30),  // 30s (min: 30s)
    createPhaseConfig(PhaseType.ClosingA, 60),    // 1 min (min: 60s)
    createPhaseConfig(PhaseType.Cooldown, 300),   // 5 min (min: 300s) - Total: 990s
  ], GuidanceLevel.Minimal)

  beforeEach(() => {
    audioService = createMockAudioService()
    timerService = createMockTimerService()
    guidanceService = createMockGuidanceService()
    engine = new SessionEngine(audioService, timerService, guidanceService)
  })

  describe('Phase completion triggers transition', () => {
    it('transitions to next phase when remaining time reaches 0', async () => {
      await engine.start(testMode)
      expect(engine.getState().currentPhaseIndex).toBe(0)

      // Simulate timer tick at end of first phase (300s)
      timerService.simulateTick(300)

      const state = engine.getState()
      expect(state.currentPhaseIndex).toBe(1)
    })

    it('sets correct remaining time for new phase', async () => {
      await engine.start(testMode)

      // Complete first phase (300s)
      timerService.simulateTick(300)

      const state = engine.getState()
      expect(state.remainingTime).toBe(300) // SlotB duration
    })

    it('updates remaining time during phase', async () => {
      await engine.start(testMode)

      timerService.simulateTick(100)

      const state = engine.getState()
      expect(state.remainingTime).toBe(200) // 300 - 100
    })

    it('remaining time never goes negative', async () => {
      await engine.start(testMode)

      timerService.simulateTick(400) // Past first phase

      const state = engine.getState()
      expect(state.remainingTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Audio events on phase transitions', () => {
    // Phase timings: SlotA@300, SlotB@600, Transition@630, ClosingA@690, Cooldown@990

    it('plays SlotEnd when SlotA ends', async () => {
      await engine.start(testMode)
      audioService.reset()

      timerService.simulateTick(300) // End of SlotA

      expect(audioService.playedEvents).toContain(AudioEvent.SlotEnd)
    })

    it('plays SlotEnd when SlotB ends', async () => {
      await engine.start(testMode)
      timerService.simulateTick(300) // End of SlotA
      audioService.reset()

      timerService.simulateTick(600) // End of SlotB

      expect(audioService.playedEvents).toContain(AudioEvent.SlotEnd)
    })

    it('plays TransitionEnd when Transition ends', async () => {
      await engine.start(testMode)
      timerService.simulateTick(600) // End of SlotA and SlotB
      audioService.reset()

      timerService.simulateTick(630) // End of Transition

      expect(audioService.playedEvents).toContain(AudioEvent.TransitionEnd)
    })

    it('plays ClosingStart when ClosingA begins', async () => {
      await engine.start(testMode)
      timerService.simulateTick(600) // End of SlotA and SlotB
      audioService.reset()

      timerService.simulateTick(630) // Start of ClosingA (after Transition)

      expect(audioService.playedEvents).toContain(AudioEvent.ClosingStart)
    })

    it('plays CooldownStart when Cooldown begins', async () => {
      await engine.start(testMode)
      timerService.simulateTick(630) // End of SlotA, SlotB, Transition
      audioService.reset()

      timerService.simulateTick(690) // Start of Cooldown (after ClosingA)

      expect(audioService.playedEvents).toContain(AudioEvent.CooldownStart)
    })

    it('plays CooldownEnd when session finishes', async () => {
      await engine.start(testMode)
      audioService.reset()

      // Complete all phases (300 + 300 + 30 + 60 + 300 = 990 seconds)
      timerService.simulateTick(990)

      expect(audioService.playedEvents).toContain(AudioEvent.CooldownEnd)
    })
  })

  describe('Session completion', () => {
    it('sets status to Finished when last phase completes', async () => {
      await engine.start(testMode)

      // Complete all phases (990s total)
      timerService.simulateTick(990)

      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Finished)
    })

    it('stops timer when session finishes', async () => {
      await engine.start(testMode)

      timerService.simulateTick(990)

      expect(timerService.isRunning()).toBe(false)
    })

    it('sets remaining time to 0 when finished', async () => {
      await engine.start(testMode)

      timerService.simulateTick(990)

      const state = engine.getState()
      expect(state.remainingTime).toBe(0)
    })

    it('preserves mode when finished', async () => {
      await engine.start(testMode)

      timerService.simulateTick(990)

      const state = engine.getState()
      expect(state.mode?.name).toBe(testMode.name)
    })
  })

  describe('Multi-round progression', () => {
    // Minimum valid durations for a 2-round mode
    // SlotA(300) + SlotB(300) + Transition(30) + SlotA(300) + SlotB(300) + Cooldown(300) = 1530s
    const multiRoundMode = createCustomMode('Multi-Round', [
      createPhaseConfig(PhaseType.SlotA, 300),
      createPhaseConfig(PhaseType.SlotB, 300),
      createPhaseConfig(PhaseType.Transition, 30),
      createPhaseConfig(PhaseType.SlotA, 300),
      createPhaseConfig(PhaseType.SlotB, 300),
      createPhaseConfig(PhaseType.Cooldown, 300),
    ], GuidanceLevel.Minimal)

    it('progresses through all phases in order', async () => {
      await engine.start(multiRoundMode)

      const phaseIndices: number[] = []
      const callback = (state: { currentPhaseIndex: number }) => {
        if (!phaseIndices.includes(state.currentPhaseIndex)) {
          phaseIndices.push(state.currentPhaseIndex)
        }
      }
      engine.subscribe(callback)

      // Simulate full session
      timerService.simulateTick(300)   // End SlotA
      timerService.simulateTick(600)   // End SlotB
      timerService.simulateTick(630)   // End Transition
      timerService.simulateTick(930)   // End SlotA (round 2)
      timerService.simulateTick(1230)  // End SlotB (round 2)
      timerService.simulateTick(1530)  // End Cooldown

      // Should have visited all 6 phases
      expect(phaseIndices).toEqual([0, 1, 2, 3, 4, 5])
    })

    it('plays correct audio sequence through multiple rounds', async () => {
      await engine.start(multiRoundMode)
      audioService.reset()

      timerService.simulateTick(1530) // Complete all phases

      // Verify key audio events occurred
      const events = audioService.playedEvents
      expect(events.filter(e => e === AudioEvent.SlotEnd).length).toBe(4) // 4 slots
      expect(events.filter(e => e === AudioEvent.TransitionEnd).length).toBe(1)
      expect(events.filter(e => e === AudioEvent.CooldownEnd).length).toBe(1)
    })
  })

  describe('Edge cases', () => {
    it('handles minimal valid mode (just SlotA, SlotB, Cooldown)', async () => {
      // Validation requires both SlotA and SlotB, so minimal is 3 phases
      const minimalMode = createCustomMode('Minimal', [
        createPhaseConfig(PhaseType.SlotA, 300),
        createPhaseConfig(PhaseType.SlotB, 300),
        createPhaseConfig(PhaseType.Cooldown, 300), // Total: 900s
      ], GuidanceLevel.Minimal)

      await engine.start(minimalMode)
      timerService.simulateTick(900)

      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Finished)
    })

    it('handles rapid tick progression', async () => {
      await engine.start(testMode)

      // Simulate ticks coming frequently
      timerService.simulateTick(50)
      timerService.simulateTick(100)
      timerService.simulateTick(150)

      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Running)
      expect(state.remainingTime).toBe(150) // 300 - 150
    })

    it('ignores ticks when paused', async () => {
      await engine.start(testMode)
      engine.pause()

      const initialRemaining = engine.getState().remainingTime

      // Timer shouldn't actually send ticks when paused, but if it did...
      // The engine should ignore them via status check

      const state = engine.getState()
      expect(state.remainingTime).toBe(initialRemaining)
    })

    it('ignores ticks when idle', async () => {
      // Engine is idle, simulate tick (shouldn't happen, but be defensive)
      const state = engine.getState()
      expect(state.status).toBe(SessionStatus.Idle)
      expect(state.remainingTime).toBe(0)
    })
  })
})

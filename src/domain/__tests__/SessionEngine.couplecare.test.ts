import { describe, it, expect, beforeEach } from 'vitest'
import { SessionEngine } from '../SessionEngine'
import { COUPLECARE_MODE } from '../SessionMode.presets'
import { getCoupleCareSessionCount } from '../../services/CoupleCareRotationService'
import { selectThemeForSession } from '../RetroTheme'
import { createMockAudioService } from '../../services/AudioService'
import { createMockTimerService } from '../../services/TimerService'
import { createMockGuidanceService } from '../../services/GuidanceService'

describe('SessionEngine - CoupleCare themed tips', () => {
  let engine: SessionEngine
  let audioService: ReturnType<typeof createMockAudioService>
  let timerService: ReturnType<typeof createMockTimerService>
  let guidanceService: ReturnType<typeof createMockGuidanceService>

  beforeEach(() => {
    localStorage.clear()
    audioService = createMockAudioService()
    timerService = createMockTimerService()
    guidanceService = createMockGuidanceService()
    engine = new SessionEngine(audioService, timerService, guidanceService)
  })

  it('round 1 slotA returns appreciation theme tip keys', async () => {
    // Arrange: counter at 0, start increments to 1 -> theme index 0
    await engine.start(COUPLECARE_MODE)
    // Act: advance into phase index 1 (first slotA, prep = 120s)
    timerService.simulateTick(121)
    // Assert
    expect(engine.getState().currentPhaseIndex).toBe(1)
    expect(engine.getTips()).toEqual([
      'couplecare.appreciation.slotA.r1.1',
      'couplecare.appreciation.slotA.r1.2',
      'couplecare.appreciation.slotA.r1.3',
    ])
  })

  it('round 2 slotA tip keys contain .r2.', async () => {
    await engine.start(COUPLECARE_MODE)
    // Advance into phase index 4 (second slotA): 120+600+600+60 elapsed
    timerService.simulateTick(1381)
    expect(engine.getState().currentPhaseIndex).toBe(4)
    const tips = engine.getTips()
    expect(tips.length).toBe(3)
    for (const key of tips) {
      expect(key).toContain('.r2.')
 expect(key.startsWith('couplecare.')).toBe(true)
    }
  })

  it('during prep returns normal guidance.prep.* tips', async () => {
    await engine.start(COUPLECARE_MODE)
    expect(engine.getState().currentPhaseIndex).toBe(0)
    const tips = engine.getTips()
    expect(tips.length).toBeGreaterThan(0)
    for (const key of tips) {
      expect(key.startsWith('guidance.prep.')).toBe(true)
    }
  })

  it('second session rotates theme to everyday-load', async () => {
    // First session
    await engine.start(COUPLECARE_MODE)
    expect(getCoupleCareSessionCount()).toBe(1)
    engine.stop()
    // Second session
    await engine.start(COUPLECARE_MODE)
    timerService.simulateTick(121)
    expect(engine.getState().currentPhaseIndex).toBe(1)
    const expectedTheme = selectThemeForSession(1)
    expect(expectedTheme.id).toBe('everyday-load')
    for (const key of engine.getTips()) {
      expect(key).toContain('couplecare.everyday-load.')
    }
  })
})

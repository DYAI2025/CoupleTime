import { describe, it, expect } from 'vitest'
import {
  MAINTAIN_MODE,
  COMMITMENT_MODE,
  LISTENING_MODE,
  PRESET_MODES,
  getPresetMode,
  createCustomTemplate,
  getDefaultDuration,
} from '../SessionMode.presets'
import {
  isSessionModeValid,
  getTotalDurationMinutes,
  getRoundCount,
} from '../SessionMode'
import { PhaseType } from '../PhaseType'
import { GuidanceLevel } from '../GuidanceLevel'

describe('SessionMode.presets', () => {
  describe('MAINTAIN_MODE', () => {
    it('is valid', () => {
      expect(isSessionModeValid(MAINTAIN_MODE)).toBe(true)
    })

    it('is locked', () => {
      expect(MAINTAIN_MODE.isLocked).toBe(true)
    })

    it('has 3 rounds (3 slotA + 3 slotB)', () => {
      expect(getRoundCount(MAINTAIN_MODE)).toBe(3)
    })

    it('has moderate guidance level', () => {
      expect(MAINTAIN_MODE.guidanceLevel).toBe(GuidanceLevel.Moderate)
    })

    it('has ~110 minutes total duration (including prep, closing, cooldown)', () => {
      const minutes = getTotalDurationMinutes(MAINTAIN_MODE)
      // 3×15min slots each = 90min speaking + prep/transition/closing/cooldown
      expect(minutes).toBeGreaterThanOrEqual(105)
      expect(minutes).toBeLessThanOrEqual(115)
    })

    it('has correct phase sequence', () => {
      const types = MAINTAIN_MODE.phases.map((p) => p.type)
      expect(types).toEqual([
        PhaseType.Prep,
        PhaseType.SlotA,
        PhaseType.SlotB,
        PhaseType.Transition,
        PhaseType.SlotA,
        PhaseType.SlotB,
        PhaseType.Transition,
        PhaseType.SlotA,
        PhaseType.SlotB,
        PhaseType.ClosingA,
        PhaseType.ClosingB,
        PhaseType.Cooldown,
      ])
    })

    it('has 15-minute slots (900s)', () => {
      const slotDurations = MAINTAIN_MODE.phases
        .filter((p) => p.type === PhaseType.SlotA || p.type === PhaseType.SlotB)
        .map((p) => p.duration)

      expect(slotDurations.every((d) => d === 900)).toBe(true)
    })
  })

  describe('COMMITMENT_MODE', () => {
    it('is valid', () => {
      expect(isSessionModeValid(COMMITMENT_MODE)).toBe(true)
    })

    it('is locked', () => {
      expect(COMMITMENT_MODE.isLocked).toBe(true)
    })

    it('has 3 rounds', () => {
      expect(getRoundCount(COMMITMENT_MODE)).toBe(3)
    })

    it('has moderate guidance level', () => {
      expect(COMMITMENT_MODE.guidanceLevel).toBe(GuidanceLevel.Moderate)
    })

    it('has ~78 minutes total duration (including prep, closing, cooldown)', () => {
      const minutes = getTotalDurationMinutes(COMMITMENT_MODE)
      // 3×10min slots each = 60min speaking + prep/transition/closing/cooldown
      expect(minutes).toBeGreaterThanOrEqual(75)
      expect(minutes).toBeLessThanOrEqual(82)
    })

    it('has 10-minute slots (600s)', () => {
      const slotDurations = COMMITMENT_MODE.phases
        .filter((p) => p.type === PhaseType.SlotA || p.type === PhaseType.SlotB)
        .map((p) => p.duration)

      expect(slotDurations.every((d) => d === 600)).toBe(true)
    })
  })

  describe('LISTENING_MODE', () => {
    it('is valid', () => {
      expect(isSessionModeValid(LISTENING_MODE)).toBe(true)
    })

    it('is locked', () => {
      expect(LISTENING_MODE.isLocked).toBe(true)
    })

    it('has 2 rounds', () => {
      expect(getRoundCount(LISTENING_MODE)).toBe(2)
    })

    it('has high guidance level (for beginners)', () => {
      expect(LISTENING_MODE.guidanceLevel).toBe(GuidanceLevel.High)
    })

    it('has ~57 minutes total duration (including prep, closing, cooldown)', () => {
      const minutes = getTotalDurationMinutes(LISTENING_MODE)
      // 2×10min slots each = 40min speaking + prep/transition/closing/cooldown
      expect(minutes).toBeGreaterThanOrEqual(54)
      expect(minutes).toBeLessThanOrEqual(60)
    })

    it('has 10-minute slots (600s)', () => {
      const slotDurations = LISTENING_MODE.phases
        .filter((p) => p.type === PhaseType.SlotA || p.type === PhaseType.SlotB)
        .map((p) => p.duration)

      expect(slotDurations.every((d) => d === 600)).toBe(true)
    })

    it('has correct phase sequence (2 rounds)', () => {
      const types = LISTENING_MODE.phases.map((p) => p.type)
      expect(types).toEqual([
        PhaseType.Prep,
        PhaseType.SlotA,
        PhaseType.SlotB,
        PhaseType.Transition,
        PhaseType.SlotA,
        PhaseType.SlotB,
        PhaseType.ClosingA,
        PhaseType.ClosingB,
        PhaseType.Cooldown,
      ])
    })
  })

  describe('PRESET_MODES', () => {
    it('contains all 3 presets', () => {
      expect(PRESET_MODES).toHaveLength(3)
      expect(PRESET_MODES).toContain(MAINTAIN_MODE)
      expect(PRESET_MODES).toContain(COMMITMENT_MODE)
      expect(PRESET_MODES).toContain(LISTENING_MODE)
    })

    it('all presets are valid', () => {
      PRESET_MODES.forEach((mode) => {
        expect(isSessionModeValid(mode)).toBe(true)
      })
    })
  })

  describe('getPresetMode', () => {
    it('returns maintain mode', () => {
      expect(getPresetMode('maintain')).toBe(MAINTAIN_MODE)
    })

    it('returns commitment mode', () => {
      expect(getPresetMode('commitment')).toBe(COMMITMENT_MODE)
    })

    it('returns listening mode', () => {
      expect(getPresetMode('listening')).toBe(LISTENING_MODE)
    })

    it('returns undefined for unknown id', () => {
      expect(getPresetMode('unknown' as any)).toBeUndefined()
    })
  })

  describe('createCustomTemplate', () => {
    it('creates minimal valid structure', () => {
      const phases = createCustomTemplate()

      const types = phases.map((p) => p.type)
      expect(types).toContain(PhaseType.Prep)
      expect(types).toContain(PhaseType.SlotA)
      expect(types).toContain(PhaseType.SlotB)
      expect(types).toContain(PhaseType.Cooldown)
    })
  })

  describe('getDefaultDuration', () => {
    it('returns correct defaults for each type', () => {
      expect(getDefaultDuration(PhaseType.Prep)).toBe(120)
      expect(getDefaultDuration(PhaseType.SlotA)).toBe(600)
      expect(getDefaultDuration(PhaseType.SlotB)).toBe(600)
      expect(getDefaultDuration(PhaseType.Transition)).toBe(60)
      expect(getDefaultDuration(PhaseType.ClosingA)).toBe(120)
      expect(getDefaultDuration(PhaseType.ClosingB)).toBe(120)
      expect(getDefaultDuration(PhaseType.Cooldown)).toBe(600)
    })
  })
})

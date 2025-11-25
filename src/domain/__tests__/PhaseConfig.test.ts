import { describe, it, expect } from 'vitest'
import {
  createPhaseConfig,
  getAllowedRange,
  isPhaseConfigValid,
  clampDuration,
  formatDuration,
  formatDurationMinutes,
  parseDuration,
  calculateTotalDuration,
  PHASE_DURATION_RANGES,
} from '../PhaseConfig'
import { PhaseType } from '../PhaseType'

describe('PhaseConfig', () => {
  describe('PHASE_DURATION_RANGES', () => {
    it('has ranges for all phase types', () => {
      expect(PHASE_DURATION_RANGES[PhaseType.Prep]).toEqual({ min: 30, max: 600 })
      expect(PHASE_DURATION_RANGES[PhaseType.SlotA]).toEqual({ min: 300, max: 1800 })
      expect(PHASE_DURATION_RANGES[PhaseType.SlotB]).toEqual({ min: 300, max: 1800 })
      expect(PHASE_DURATION_RANGES[PhaseType.Transition]).toEqual({ min: 30, max: 300 })
      expect(PHASE_DURATION_RANGES[PhaseType.ClosingA]).toEqual({ min: 60, max: 600 })
      expect(PHASE_DURATION_RANGES[PhaseType.ClosingB]).toEqual({ min: 60, max: 600 })
      expect(PHASE_DURATION_RANGES[PhaseType.Cooldown]).toEqual({ min: 300, max: 1800 })
    })
  })

  describe('createPhaseConfig', () => {
    it('creates a phase config with generated id', () => {
      const config = createPhaseConfig(PhaseType.SlotA, 900)
      expect(config.type).toBe(PhaseType.SlotA)
      expect(config.duration).toBe(900)
      expect(config.id).toContain('slotA')
    })

    it('uses provided id', () => {
      const config = createPhaseConfig(PhaseType.Prep, 120, 'custom-id')
      expect(config.id).toBe('custom-id')
    })
  })

  describe('getAllowedRange', () => {
    it('returns correct range for each type', () => {
      expect(getAllowedRange(PhaseType.SlotA)).toEqual({ min: 300, max: 1800 })
      expect(getAllowedRange(PhaseType.Prep)).toEqual({ min: 30, max: 600 })
    })
  })

  describe('isPhaseConfigValid', () => {
    it('returns true for duration within range', () => {
      const config = createPhaseConfig(PhaseType.SlotA, 900) // 15 min, within 5-30 min
      expect(isPhaseConfigValid(config)).toBe(true)
    })

    it('returns true for duration at min boundary', () => {
      const config = createPhaseConfig(PhaseType.SlotA, 300) // exactly min
      expect(isPhaseConfigValid(config)).toBe(true)
    })

    it('returns true for duration at max boundary', () => {
      const config = createPhaseConfig(PhaseType.SlotA, 1800) // exactly max
      expect(isPhaseConfigValid(config)).toBe(true)
    })

    it('returns false for duration below min', () => {
      const config = createPhaseConfig(PhaseType.SlotA, 299) // below min
      expect(isPhaseConfigValid(config)).toBe(false)
    })

    it('returns false for duration above max', () => {
      const config = createPhaseConfig(PhaseType.SlotA, 1801) // above max
      expect(isPhaseConfigValid(config)).toBe(false)
    })
  })

  describe('clampDuration', () => {
    it('returns same value if within range', () => {
      expect(clampDuration(PhaseType.SlotA, 900)).toBe(900)
    })

    it('clamps to min if below', () => {
      expect(clampDuration(PhaseType.SlotA, 100)).toBe(300)
    })

    it('clamps to max if above', () => {
      expect(clampDuration(PhaseType.SlotA, 3000)).toBe(1800)
    })
  })

  describe('formatDuration', () => {
    it('formats seconds to MM:SS', () => {
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(905)).toBe('15:05')
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(59)).toBe('0:59')
    })

    it('formats to H:MM:SS for 1 hour or more', () => {
      expect(formatDuration(3600)).toBe('1:00:00')
      expect(formatDuration(3661)).toBe('1:01:01')
      expect(formatDuration(5400)).toBe('1:30:00')
    })
  })

  describe('formatDurationMinutes', () => {
    it('returns minutes rounded', () => {
      expect(formatDurationMinutes(900)).toBe(15)
      expect(formatDurationMinutes(630)).toBe(11) // 10.5 → 11
      expect(formatDurationMinutes(120)).toBe(2)
    })
  })

  describe('parseDuration', () => {
    it('parses MM:SS format', () => {
      expect(parseDuration('15:00')).toBe(900)
      expect(parseDuration('1:30')).toBe(90)
      expect(parseDuration('0:59')).toBe(59)
    })

    it('parses H:MM:SS format', () => {
      expect(parseDuration('1:00:00')).toBe(3600)
      expect(parseDuration('1:30:00')).toBe(5400)
      expect(parseDuration('2:15:30')).toBe(8130)
    })
  })

  describe('calculateTotalDuration', () => {
    it('sums all phase durations', () => {
      const phases = [
        createPhaseConfig(PhaseType.Prep, 120),
        createPhaseConfig(PhaseType.SlotA, 900),
        createPhaseConfig(PhaseType.SlotB, 900),
        createPhaseConfig(PhaseType.Cooldown, 600),
      ]
      expect(calculateTotalDuration(phases)).toBe(2520)
    })

    it('returns 0 for empty array', () => {
      expect(calculateTotalDuration([])).toBe(0)
    })
  })
})

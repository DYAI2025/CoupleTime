import { describe, it, expect } from 'vitest'
import {
  SessionMode,
  hasSlotA,
  hasSlotB,
  isSessionModeValid,
  getValidationErrors,
  getTotalDuration,
  getTotalDurationMinutes,
  getRoundCount,
  createCustomMode,
  cloneMode,
} from '../SessionMode'
import { createPhaseConfig } from '../PhaseConfig'
import { PhaseType } from '../PhaseType'
import { GuidanceLevel } from '../GuidanceLevel'

describe('SessionMode', () => {
  // Helper to create a minimal valid mode
  const createValidMode = (): SessionMode => ({
    id: 'test-mode',
    name: 'Test Mode',
    phases: [
      createPhaseConfig(PhaseType.Prep, 120, 'prep'),
      createPhaseConfig(PhaseType.SlotA, 600, 'slotA'),
      createPhaseConfig(PhaseType.SlotB, 600, 'slotB'),
      createPhaseConfig(PhaseType.Cooldown, 600, 'cooldown'),
    ],
    guidanceLevel: GuidanceLevel.Moderate,
    isLocked: false,
  })

  describe('hasSlotA', () => {
    it('returns true when mode has slotA', () => {
      const mode = createValidMode()
      expect(hasSlotA(mode)).toBe(true)
    })

    it('returns false when mode has no slotA', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [createPhaseConfig(PhaseType.SlotB, 600, 'slotB')],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      expect(hasSlotA(mode)).toBe(false)
    })
  })

  describe('hasSlotB', () => {
    it('returns true when mode has slotB', () => {
      const mode = createValidMode()
      expect(hasSlotB(mode)).toBe(true)
    })

    it('returns false when mode has no slotB', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [createPhaseConfig(PhaseType.SlotA, 600, 'slotA')],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      expect(hasSlotB(mode)).toBe(false)
    })
  })

  describe('isSessionModeValid', () => {
    it('returns true for valid mode with slotA and slotB', () => {
      const mode = createValidMode()
      expect(isSessionModeValid(mode)).toBe(true)
    })

    it('returns false for mode without slotA', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [
          createPhaseConfig(PhaseType.Prep, 120, 'prep'),
          createPhaseConfig(PhaseType.SlotB, 600, 'slotB'),
        ],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      expect(isSessionModeValid(mode)).toBe(false)
    })

    it('returns false for mode without slotB', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [
          createPhaseConfig(PhaseType.Prep, 120, 'prep'),
          createPhaseConfig(PhaseType.SlotA, 600, 'slotA'),
        ],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      expect(isSessionModeValid(mode)).toBe(false)
    })

    it('returns false for empty phases', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      expect(isSessionModeValid(mode)).toBe(false)
    })

    it('returns false for invalid phase duration', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [
          createPhaseConfig(PhaseType.SlotA, 100, 'slotA'), // Below min (300)
          createPhaseConfig(PhaseType.SlotB, 600, 'slotB'),
        ],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      expect(isSessionModeValid(mode)).toBe(false)
    })
  })

  describe('getValidationErrors', () => {
    it('returns empty array for valid mode', () => {
      const mode = createValidMode()
      expect(getValidationErrors(mode)).toHaveLength(0)
    })

    it('returns error for missing slotA', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [createPhaseConfig(PhaseType.SlotB, 600, 'slotB')],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      const errors = getValidationErrors(mode)
      expect(errors).toContain('builder.validation.needSlotA')
    })

    it('returns error for missing slotB', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [createPhaseConfig(PhaseType.SlotA, 600, 'slotA')],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      const errors = getValidationErrors(mode)
      expect(errors).toContain('builder.validation.needSlotB')
    })
  })

  describe('getTotalDuration', () => {
    it('sums all phase durations', () => {
      const mode = createValidMode()
      // 120 + 600 + 600 + 600 = 1920
      expect(getTotalDuration(mode)).toBe(1920)
    })
  })

  describe('getTotalDurationMinutes', () => {
    it('returns duration in minutes (rounded)', () => {
      const mode = createValidMode()
      // 1920 seconds = 32 minutes
      expect(getTotalDurationMinutes(mode)).toBe(32)
    })
  })

  describe('getRoundCount', () => {
    it('counts A/B round pairs', () => {
      const mode = createValidMode()
      // 1 slotA + 1 slotB = 1 round
      expect(getRoundCount(mode)).toBe(1)
    })

    it('returns minimum of slotA and slotB counts', () => {
      const mode: SessionMode = {
        id: 'test',
        name: 'Test',
        phases: [
          createPhaseConfig(PhaseType.SlotA, 600, 'slotA-1'),
          createPhaseConfig(PhaseType.SlotB, 600, 'slotB-1'),
          createPhaseConfig(PhaseType.SlotA, 600, 'slotA-2'),
          createPhaseConfig(PhaseType.SlotB, 600, 'slotB-2'),
          createPhaseConfig(PhaseType.SlotA, 600, 'slotA-3'),
        ],
        guidanceLevel: GuidanceLevel.Moderate,
        isLocked: false,
      }
      // 3 slotA, 2 slotB = 2 rounds
      expect(getRoundCount(mode)).toBe(2)
    })
  })

  describe('createCustomMode', () => {
    it('creates a custom mode with generated id', () => {
      const phases = [
        createPhaseConfig(PhaseType.SlotA, 600),
        createPhaseConfig(PhaseType.SlotB, 600),
      ]
      const mode = createCustomMode('My Mode', phases)

      expect(mode.id).toContain('custom-')
      expect(mode.name).toBe('My Mode')
      expect(mode.isLocked).toBe(false)
      expect(mode.createdAt).toBeDefined()
    })

    it('uses provided guidance level', () => {
      const phases = [
        createPhaseConfig(PhaseType.SlotA, 600),
        createPhaseConfig(PhaseType.SlotB, 600),
      ]
      const mode = createCustomMode('My Mode', phases, GuidanceLevel.High)
      expect(mode.guidanceLevel).toBe(GuidanceLevel.High)
    })
  })

  describe('cloneMode', () => {
    it('creates a copy with new id', () => {
      const original = createValidMode()
      const cloned = cloneMode(original)

      expect(cloned.id).not.toBe(original.id)
      expect(cloned.isLocked).toBe(false)
      expect(cloned.phases).toHaveLength(original.phases.length)
    })

    it('uses new name if provided', () => {
      const original = createValidMode()
      const cloned = cloneMode(original, 'New Name')
      expect(cloned.name).toBe('New Name')
    })
  })
})

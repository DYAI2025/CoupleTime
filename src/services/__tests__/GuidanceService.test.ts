import { describe, it, expect } from 'vitest'
import {
  GuidanceService,
  getTipCategoryForPhase,
  getTipKeys,
  shouldShowTips,
  createMockGuidanceService,
} from '../GuidanceService'
import { PhaseType } from '../../domain/PhaseType'
import { GuidanceLevel } from '../../domain/GuidanceLevel'

describe('GuidanceService', () => {
  describe('getTipCategoryForPhase', () => {
    it('returns prep for Prep phase', () => {
      expect(getTipCategoryForPhase(PhaseType.Prep)).toBe('prep')
    })

    it('returns transition for Transition phase', () => {
      expect(getTipCategoryForPhase(PhaseType.Transition)).toBe('transition')
    })

    it('returns cooldown for Cooldown phase', () => {
      expect(getTipCategoryForPhase(PhaseType.Cooldown)).toBe('cooldown')
    })

    it('returns null for speaking phases', () => {
      expect(getTipCategoryForPhase(PhaseType.SlotA)).toBeNull()
      expect(getTipCategoryForPhase(PhaseType.SlotB)).toBeNull()
      expect(getTipCategoryForPhase(PhaseType.ClosingA)).toBeNull()
      expect(getTipCategoryForPhase(PhaseType.ClosingB)).toBeNull()
    })
  })

  describe('getTipKeys', () => {
    it('returns 5 prep tips', () => {
      const keys = getTipKeys('prep')
      expect(keys).toHaveLength(5)
      expect(keys[0]).toBe('guidance.prep.tip1')
      expect(keys[4]).toBe('guidance.prep.tip5')
    })

    it('returns 5 transition tips', () => {
      const keys = getTipKeys('transition')
      expect(keys).toHaveLength(5)
      expect(keys[0]).toBe('guidance.transition.tip1')
    })

    it('returns 5 cooldown tips', () => {
      const keys = getTipKeys('cooldown')
      expect(keys).toHaveLength(5)
      expect(keys[0]).toBe('guidance.cooldown.tip1')
    })
  })

  describe('shouldShowTips', () => {
    describe('with Minimal guidance', () => {
      it('shows cooldown tips', () => {
        expect(shouldShowTips(PhaseType.Cooldown, GuidanceLevel.Minimal)).toBe(true)
      })

      it('does not show prep tips', () => {
        expect(shouldShowTips(PhaseType.Prep, GuidanceLevel.Minimal)).toBe(false)
      })

      it('does not show transition tips', () => {
        expect(shouldShowTips(PhaseType.Transition, GuidanceLevel.Minimal)).toBe(false)
      })
    })

    describe('with Moderate guidance', () => {
      it('shows cooldown tips', () => {
        expect(shouldShowTips(PhaseType.Cooldown, GuidanceLevel.Moderate)).toBe(true)
      })

      it('shows transition tips', () => {
        expect(shouldShowTips(PhaseType.Transition, GuidanceLevel.Moderate)).toBe(true)
      })

      it('does not show prep tips', () => {
        expect(shouldShowTips(PhaseType.Prep, GuidanceLevel.Moderate)).toBe(false)
      })
    })

    describe('with High guidance', () => {
      it('shows cooldown tips', () => {
        expect(shouldShowTips(PhaseType.Cooldown, GuidanceLevel.High)).toBe(true)
      })

      it('shows transition tips', () => {
        expect(shouldShowTips(PhaseType.Transition, GuidanceLevel.High)).toBe(true)
      })

      it('shows prep tips', () => {
        expect(shouldShowTips(PhaseType.Prep, GuidanceLevel.High)).toBe(true)
      })
    })

    it('returns false for speaking phases at any level', () => {
      expect(shouldShowTips(PhaseType.SlotA, GuidanceLevel.High)).toBe(false)
      expect(shouldShowTips(PhaseType.SlotB, GuidanceLevel.High)).toBe(false)
    })
  })

  describe('GuidanceService.getTipsForPhase', () => {
    it('returns empty array when tips should not be shown', () => {
      const tips = GuidanceService.getTipsForPhase(PhaseType.Prep, GuidanceLevel.Minimal)
      expect(tips).toHaveLength(0)
    })

    it('returns tip keys when tips should be shown', () => {
      const tips = GuidanceService.getTipsForPhase(PhaseType.Cooldown, GuidanceLevel.Minimal)
      expect(tips).toHaveLength(5)
      expect(tips[0]).toContain('guidance.cooldown')
    })

    it('returns prep tips for High guidance', () => {
      const tips = GuidanceService.getTipsForPhase(PhaseType.Prep, GuidanceLevel.High)
      expect(tips).toHaveLength(5)
      expect(tips[0]).toBe('guidance.prep.tip1')
    })
  })

  describe('GuidanceService.getRandomTip', () => {
    it('returns null when tips should not be shown', () => {
      const tip = GuidanceService.getRandomTip(PhaseType.Prep, GuidanceLevel.Minimal)
      expect(tip).toBeNull()
    })

    it('returns a tip key when tips should be shown', () => {
      const tip = GuidanceService.getRandomTip(PhaseType.Cooldown, GuidanceLevel.Minimal)
      expect(tip).not.toBeNull()
      expect(tip).toContain('guidance.cooldown.tip')
    })

    it('returns null for speaking phases', () => {
      const tip = GuidanceService.getRandomTip(PhaseType.SlotA, GuidanceLevel.High)
      expect(tip).toBeNull()
    })
  })

  describe('GuidanceService.shouldShowTips', () => {
    it('delegates to shouldShowTips function', () => {
      expect(GuidanceService.shouldShowTips(PhaseType.Prep, GuidanceLevel.High)).toBe(true)
      expect(GuidanceService.shouldShowTips(PhaseType.Prep, GuidanceLevel.Minimal)).toBe(false)
    })
  })

  describe('createMockGuidanceService', () => {
    it('returns predictable first tip for getRandomTip', () => {
      const mock = createMockGuidanceService()
      const tip = mock.getRandomTip(PhaseType.Cooldown, GuidanceLevel.Minimal)
      expect(tip).toBe('guidance.cooldown.tip1')
    })

    it('returns same results as real service for getTipsForPhase', () => {
      const mock = createMockGuidanceService()
      const mockTips = mock.getTipsForPhase(PhaseType.Cooldown, GuidanceLevel.Minimal)
      const realTips = GuidanceService.getTipsForPhase(PhaseType.Cooldown, GuidanceLevel.Minimal)
      expect(mockTips).toEqual(realTips)
    })
  })
})

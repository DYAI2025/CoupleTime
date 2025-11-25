import { describe, it, expect } from 'vitest'
import {
  GuidanceLevel,
  getGuidanceConfig,
  shouldShowPrepTips,
  shouldShowTransitionTips,
  shouldShowCooldownTips,
  getAllGuidanceLevels,
} from '../GuidanceLevel'

describe('GuidanceLevel', () => {
  describe('enum values', () => {
    it('has minimal, moderate, and high', () => {
      expect(GuidanceLevel.Minimal).toBe('minimal')
      expect(GuidanceLevel.Moderate).toBe('moderate')
      expect(GuidanceLevel.High).toBe('high')
    })
  })

  describe('getGuidanceConfig', () => {
    it('returns correct config for minimal', () => {
      const config = getGuidanceConfig(GuidanceLevel.Minimal)
      expect(config.showPrepTips).toBe(false)
      expect(config.showTransitionTips).toBe(false)
      expect(config.showCooldownTips).toBe(true)
      expect(config.showBreathingExercise).toBe(false)
    })

    it('returns correct config for moderate', () => {
      const config = getGuidanceConfig(GuidanceLevel.Moderate)
      expect(config.showPrepTips).toBe(false)
      expect(config.showTransitionTips).toBe(true)
      expect(config.showCooldownTips).toBe(true)
      expect(config.showBreathingExercise).toBe(false)
    })

    it('returns correct config for high', () => {
      const config = getGuidanceConfig(GuidanceLevel.High)
      expect(config.showPrepTips).toBe(true)
      expect(config.showTransitionTips).toBe(true)
      expect(config.showCooldownTips).toBe(true)
      expect(config.showBreathingExercise).toBe(true)
    })
  })

  describe('shouldShowPrepTips', () => {
    it('returns false for minimal', () => {
      expect(shouldShowPrepTips(GuidanceLevel.Minimal)).toBe(false)
    })

    it('returns false for moderate', () => {
      expect(shouldShowPrepTips(GuidanceLevel.Moderate)).toBe(false)
    })

    it('returns true for high', () => {
      expect(shouldShowPrepTips(GuidanceLevel.High)).toBe(true)
    })
  })

  describe('shouldShowTransitionTips', () => {
    it('returns false for minimal', () => {
      expect(shouldShowTransitionTips(GuidanceLevel.Minimal)).toBe(false)
    })

    it('returns true for moderate', () => {
      expect(shouldShowTransitionTips(GuidanceLevel.Moderate)).toBe(true)
    })

    it('returns true for high', () => {
      expect(shouldShowTransitionTips(GuidanceLevel.High)).toBe(true)
    })
  })

  describe('shouldShowCooldownTips', () => {
    it('returns true for all levels (cooldown tips always shown)', () => {
      expect(shouldShowCooldownTips(GuidanceLevel.Minimal)).toBe(true)
      expect(shouldShowCooldownTips(GuidanceLevel.Moderate)).toBe(true)
      expect(shouldShowCooldownTips(GuidanceLevel.High)).toBe(true)
    })
  })

  describe('getAllGuidanceLevels', () => {
    it('returns all 3 levels', () => {
      const levels = getAllGuidanceLevels()
      expect(levels).toHaveLength(3)
      expect(levels).toContain(GuidanceLevel.Minimal)
      expect(levels).toContain(GuidanceLevel.Moderate)
      expect(levels).toContain(GuidanceLevel.High)
    })
  })
})

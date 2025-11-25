import { describe, it, expect } from 'vitest'
import {
  PhaseType,
  isSpeakingPhase,
  isPartnerAPhase,
  isPartnerBPhase,
  getAllPhaseTypes,
  getPhaseI18nKey,
} from '../PhaseType'

describe('PhaseType', () => {
  describe('enum values', () => {
    it('has all required phase types', () => {
      expect(PhaseType.Prep).toBe('prep')
      expect(PhaseType.SlotA).toBe('slotA')
      expect(PhaseType.SlotB).toBe('slotB')
      expect(PhaseType.Transition).toBe('transition')
      expect(PhaseType.ClosingA).toBe('closingA')
      expect(PhaseType.ClosingB).toBe('closingB')
      expect(PhaseType.Cooldown).toBe('cooldown')
    })
  })

  describe('isSpeakingPhase', () => {
    it('returns true for slotA', () => {
      expect(isSpeakingPhase(PhaseType.SlotA)).toBe(true)
    })

    it('returns true for slotB', () => {
      expect(isSpeakingPhase(PhaseType.SlotB)).toBe(true)
    })

    it('returns true for closingA', () => {
      expect(isSpeakingPhase(PhaseType.ClosingA)).toBe(true)
    })

    it('returns true for closingB', () => {
      expect(isSpeakingPhase(PhaseType.ClosingB)).toBe(true)
    })

    it('returns false for prep', () => {
      expect(isSpeakingPhase(PhaseType.Prep)).toBe(false)
    })

    it('returns false for transition', () => {
      expect(isSpeakingPhase(PhaseType.Transition)).toBe(false)
    })

    it('returns false for cooldown', () => {
      expect(isSpeakingPhase(PhaseType.Cooldown)).toBe(false)
    })
  })

  describe('isPartnerAPhase', () => {
    it('returns true for slotA and closingA', () => {
      expect(isPartnerAPhase(PhaseType.SlotA)).toBe(true)
      expect(isPartnerAPhase(PhaseType.ClosingA)).toBe(true)
    })

    it('returns false for other phases', () => {
      expect(isPartnerAPhase(PhaseType.SlotB)).toBe(false)
      expect(isPartnerAPhase(PhaseType.ClosingB)).toBe(false)
      expect(isPartnerAPhase(PhaseType.Prep)).toBe(false)
      expect(isPartnerAPhase(PhaseType.Transition)).toBe(false)
      expect(isPartnerAPhase(PhaseType.Cooldown)).toBe(false)
    })
  })

  describe('isPartnerBPhase', () => {
    it('returns true for slotB and closingB', () => {
      expect(isPartnerBPhase(PhaseType.SlotB)).toBe(true)
      expect(isPartnerBPhase(PhaseType.ClosingB)).toBe(true)
    })

    it('returns false for other phases', () => {
      expect(isPartnerBPhase(PhaseType.SlotA)).toBe(false)
      expect(isPartnerBPhase(PhaseType.ClosingA)).toBe(false)
      expect(isPartnerBPhase(PhaseType.Prep)).toBe(false)
      expect(isPartnerBPhase(PhaseType.Transition)).toBe(false)
      expect(isPartnerBPhase(PhaseType.Cooldown)).toBe(false)
    })
  })

  describe('getAllPhaseTypes', () => {
    it('returns all 7 phase types', () => {
      const phases = getAllPhaseTypes()
      expect(phases).toHaveLength(7)
      expect(phases).toContain(PhaseType.Prep)
      expect(phases).toContain(PhaseType.SlotA)
      expect(phases).toContain(PhaseType.SlotB)
      expect(phases).toContain(PhaseType.Transition)
      expect(phases).toContain(PhaseType.ClosingA)
      expect(phases).toContain(PhaseType.ClosingB)
      expect(phases).toContain(PhaseType.Cooldown)
    })
  })

  describe('getPhaseI18nKey', () => {
    it('returns correct i18n key for each phase', () => {
      expect(getPhaseI18nKey(PhaseType.Prep)).toBe('phases.prep')
      expect(getPhaseI18nKey(PhaseType.SlotA)).toBe('phases.slotA')
      expect(getPhaseI18nKey(PhaseType.Cooldown)).toBe('phases.cooldown')
    })
  })
})

import { describe, it, expect } from 'vitest'
import {
  Speaker,
  getSpeakerForPhase,
  getOtherSpeaker,
  getSpeakerI18nKey,
} from '../Speaker'
import { PhaseType } from '../PhaseType'

describe('Speaker', () => {
  describe('enum values', () => {
    it('has A, B, and None', () => {
      expect(Speaker.A).toBe('a')
      expect(Speaker.B).toBe('b')
      expect(Speaker.None).toBe('none')
    })
  })

  describe('getSpeakerForPhase', () => {
    it('returns Speaker.A for slotA', () => {
      expect(getSpeakerForPhase(PhaseType.SlotA)).toBe(Speaker.A)
    })

    it('returns Speaker.A for closingA', () => {
      expect(getSpeakerForPhase(PhaseType.ClosingA)).toBe(Speaker.A)
    })

    it('returns Speaker.B for slotB', () => {
      expect(getSpeakerForPhase(PhaseType.SlotB)).toBe(Speaker.B)
    })

    it('returns Speaker.B for closingB', () => {
      expect(getSpeakerForPhase(PhaseType.ClosingB)).toBe(Speaker.B)
    })

    it('returns Speaker.None for prep', () => {
      expect(getSpeakerForPhase(PhaseType.Prep)).toBe(Speaker.None)
    })

    it('returns Speaker.None for transition', () => {
      expect(getSpeakerForPhase(PhaseType.Transition)).toBe(Speaker.None)
    })

    it('returns Speaker.None for cooldown', () => {
      expect(getSpeakerForPhase(PhaseType.Cooldown)).toBe(Speaker.None)
    })
  })

  describe('getOtherSpeaker', () => {
    it('returns B for A', () => {
      expect(getOtherSpeaker(Speaker.A)).toBe(Speaker.B)
    })

    it('returns A for B', () => {
      expect(getOtherSpeaker(Speaker.B)).toBe(Speaker.A)
    })

    it('returns None for None', () => {
      expect(getOtherSpeaker(Speaker.None)).toBe(Speaker.None)
    })
  })

  describe('getSpeakerI18nKey', () => {
    it('returns correct key for A', () => {
      expect(getSpeakerI18nKey(Speaker.A)).toBe('speakers.a')
    })

    it('returns correct key for B', () => {
      expect(getSpeakerI18nKey(Speaker.B)).toBe('speakers.b')
    })

    it('returns empty string for None', () => {
      expect(getSpeakerI18nKey(Speaker.None)).toBe('')
    })
  })
})

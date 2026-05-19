import { describe, it, expect } from 'vitest'
import { hexToRgb, calculateLuminance, calculateContrastRatio, getContrastingTextColor } from '../colorContrast'

describe('colorContrast', () => {
  describe('hexToRgb', () => {
    it('parses 6-digit hex color', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('parses lowercase hex', () => {
      expect(hexToRgb('#ff6600')).toEqual({ r: 255, g: 102, b: 0 })
    })

    it('returns null for invalid hex', () => {
      expect(hexToRgb('notacolor')).toBeNull()
    })
  })

  describe('calculateLuminance', () => {
    it('returns 1 for white', () => {
      expect(calculateLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4)
    })

    it('returns 0 for black', () => {
      expect(calculateLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 4)
    })
  })

  describe('calculateContrastRatio', () => {
    it('returns 21 for black on white', () => {
      expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    })

    it('returns 1 for same color', () => {
      expect(calculateContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 0)
    })
  })

  describe('getContrastingTextColor', () => {
    it('returns white text on dark background', () => {
      expect(getContrastingTextColor('#1a1a2e')).toBe('#ffffff')
    })

    it('returns black text on light background', () => {
      expect(getContrastingTextColor('#f0f0f0')).toBe('#000000')
    })

    it('returns #000000 for invalid hex (safe fallback)', () => {
      expect(getContrastingTextColor('garbage')).toBe('#000000')
    })
  })
})

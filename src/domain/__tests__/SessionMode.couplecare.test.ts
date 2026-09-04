import { describe, it, expect } from 'vitest'
import { COUPLECARE_MODE, PRESET_MODES } from '../SessionMode.presets'
import { isSessionModeValid, getRoundCount } from '../SessionMode'

describe('COUPLECARE_MODE', () => {
  it('is a valid preset with 3 rounds', () => {
    expect(isSessionModeValid(COUPLECARE_MODE)).toBe(true)
    expect(COUPLECARE_MODE.id).toBe('couplecare')
    expect(COUPLECARE_MODE.isLocked).toBe(true)
    expect(getRoundCount(COUPLECARE_MODE)).toBe(3)
  })

  it('is registered in PRESET_MODES', () => {
    expect(PRESET_MODES.some((m) => m.id === 'couplecare')).toBe(true)
  })

  it('speaking phases respect duration bounds (300-1800s)', () => {
    for (const p of COUPLECARE_MODE.phases) {
      if (p.type === 'slotA' || p.type === 'slotB') {
        expect(p.duration).toBeGreaterThanOrEqual(300)
        expect(p.duration).toBeLessThanOrEqual(1800)
      }
    }
  })
})

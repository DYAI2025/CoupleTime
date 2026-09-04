import { describe, it, expect } from 'vitest'
import { getCoupleCareTipKeys } from '../CoupleCareGuidance'

describe('getCoupleCareTipKeys', () => {
  it('returns 3 distinct slotA keys for round 1 of theme appreciation', () => {
    const keys = getCoupleCareTipKeys('appreciation', 1, 'slotA')
    expect(keys).toHaveLength(3)
    expect(keys[0]).toBe('couplecare.appreciation.slotA.r1.1')
    expect(keys[1]).toBe('couplecare.appreciation.slotA.r1.2')
    expect(keys[2]).toBe('couplecare.appreciation.slotA.r1.3')
  })

  it('round 2 uses different keys than round 1', () => {
    const r1 = getCoupleCareTipKeys('wishes', 1, 'slotA')
    const r2 = getCoupleCareTipKeys('wishes', 2, 'slotA')
    expect(r1[0]).not.toBe(r2[0])
    expect(r2[0]).toBe('couplecare.wishes.slotA.r2.1')
  })

  it('wraps rounds beyond 3 back into the pool', () => {
    const keys = getCoupleCareTipKeys('repair', 4, 'slotB')
    expect(keys[0]).toBe('couplecare.repair.slotB.r1.1')
  })

  it('is robust against round 0 and negatives', () => {
    expect(getCoupleCareTipKeys('future', 0, 'slotA')[0]).toBe('couplecare.future.slotA.r3.1')
    expect(getCoupleCareTipKeys('boundaries', -2, 'slotB')[0]).toBe('couplecare.boundaries.slotB.r1.1')
  })
})

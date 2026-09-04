import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCoupleCareSessionCount,
  incrementCoupleCareSessionCount,
} from '../CoupleCareRotationService'

describe('CoupleCareRotationService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns 0 when never started', () => {
    expect(getCoupleCareSessionCount()).toBe(0)
  })

  it('increments and persists', () => {
    incrementCoupleCareSessionCount()
    incrementCoupleCareSessionCount()
    expect(getCoupleCareSessionCount()).toBe(2)
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('couplecare_session_count', 'not-a-number')
    expect(getCoupleCareSessionCount()).toBe(0)
  })
})

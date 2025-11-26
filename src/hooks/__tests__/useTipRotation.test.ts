import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTipRotation } from '../useTipRotation'

describe('useTipRotation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const tips = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5']

  it('should start at index 0', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.current).toBe('tip1')
  })

  it('should advance to next tip on manual next', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    act(() => result.current.next())
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.current).toBe('tip2')
  })

  it('should go back to previous tip', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    act(() => result.current.next())
    act(() => result.current.previous())
    expect(result.current.currentIndex).toBe(0)
  })

  it('should wrap around at end', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: false })
    )
    // Go to end
    for (let i = 0; i < 4; i++) act(() => result.current.next())
    expect(result.current.currentIndex).toBe(4)
    // Should wrap to 0
    act(() => result.current.next())
    expect(result.current.currentIndex).toBe(0)
  })

  it('should shuffle indices when shuffleMode is true', () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: false, interval: 20, shuffleMode: true })
    )
    // Should have shuffled indices
    const seenTips = new Set()
    for (let i = 0; i < 5; i++) {
      seenTips.add(result.current.current)
      act(() => result.current.next())
    }
    // All tips should appear exactly once
    expect(seenTips.size).toBe(5)
  })

  it('should auto-rotate when enabled', async () => {
    const { result } = renderHook(() =>
      useTipRotation({ tips, autoRotate: true, interval: 2, shuffleMode: false })
    )
    expect(result.current.currentIndex).toBe(0)

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.currentIndex).toBe(1)

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.currentIndex).toBe(2)
  })
})

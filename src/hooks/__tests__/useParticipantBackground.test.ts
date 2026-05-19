import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useParticipantBackground } from '../useParticipantBackground'
import { Speaker } from '../../domain/Speaker'

describe('useParticipantBackground', () => {
  const colorA = '#3b82f6'
  const colorB = '#8b5cf6'

  it('returns colorA background when speaker is A', () => {
    const { result } = renderHook(() =>
      useParticipantBackground(Speaker.A, colorA, colorB)
    )
    expect(result.current.backgroundColor).toBe(colorA)
  })

  it('returns colorB background when speaker is B', () => {
    const { result } = renderHook(() =>
      useParticipantBackground(Speaker.B, colorA, colorB)
    )
    expect(result.current.backgroundColor).toBe(colorB)
  })

  it('returns transparent background when speaker is None', () => {
    const { result } = renderHook(() =>
      useParticipantBackground(Speaker.None, colorA, colorB)
    )
    expect(result.current.backgroundColor).toBe('transparent')
  })

  it('returns contrasting text color for speaker A', () => {
    const { result } = renderHook(() =>
      useParticipantBackground(Speaker.A, '#000000', colorB)
    )
    expect(result.current.textColor).toBe('#ffffff')
  })

  it('returns empty string textColor when speaker is None', () => {
    const { result } = renderHook(() =>
      useParticipantBackground(Speaker.None, colorA, colorB)
    )
    expect(result.current.textColor).toBe('')
  })
})

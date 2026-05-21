import { describe, it, expect, vi } from 'vitest'

describe('VibeMindService URL helpers — base URL set', () => {
  it('getTranscriptMdUrl returns correct URL', async () => {
    vi.stubEnv('VITE_VIBEMIND_API_URL', 'https://api.example.com')
    const { getTranscriptMdUrl } = await import('../VibeMindService?t=1')
    expect(getTranscriptMdUrl('abc123')).toBe(
      'https://api.example.com/sessions/abc123/transcript.md'
    )
    vi.unstubAllEnvs()
  })

  it('getSummaryMdUrl returns correct URL', async () => {
    vi.stubEnv('VITE_VIBEMIND_API_URL', 'https://api.example.com')
    const { getSummaryMdUrl } = await import('../VibeMindService?t=2')
    expect(getSummaryMdUrl('abc123')).toBe(
      'https://api.example.com/sessions/abc123/summary.md'
    )
    vi.unstubAllEnvs()
  })
})

describe('VibeMindService URL helpers — no base URL', () => {
  it('getTranscriptMdUrl returns null when URL not configured', async () => {
    vi.stubEnv('VITE_VIBEMIND_API_URL', '')
    const { getTranscriptMdUrl } = await import('../VibeMindService?t=3')
    expect(getTranscriptMdUrl('abc123')).toBeNull()
    vi.unstubAllEnvs()
  })

  it('getSummaryMdUrl returns null when URL not configured', async () => {
    vi.stubEnv('VITE_VIBEMIND_API_URL', '')
    const { getSummaryMdUrl } = await import('../VibeMindService?t=4')
    expect(getSummaryMdUrl('abc123')).toBeNull()
    vi.unstubAllEnvs()
  })
})

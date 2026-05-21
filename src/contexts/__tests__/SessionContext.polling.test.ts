import { describe, it, expect, vi, afterEach } from 'vitest'
import { startStatusPolling } from '../../services/VibeMindService'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.stubEnv('VITE_VIBEMIND_API_URL', 'https://api.example.com')

afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})

function makeDoneResponse(overrides = {}) {
  return {
    ok: true,
    json: async () => ({
      session_id: 'abc',
      status: 'done',
      transcript_available: true,
      summary_available: true,
      created_at: new Date().toISOString(),
      mode_name: 'Listening',
      participant_name_a: 'A',
      participant_name_b: 'B',
      transcript: null,
      error: null,
      ...overrides,
    }),
  }
}

describe('startStatusPolling', () => {
  it('calls onUpdate when session is done', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(makeDoneResponse())

    const onUpdate = vi.fn()
    startStatusPolling('abc', onUpdate, 5000, 5)

    await vi.advanceTimersByTimeAsync(5100)

    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onUpdate.mock.calls[0][0].status).toBe('done')
    expect(onUpdate.mock.calls[0][0].transcript_available).toBe(true)
    vi.useRealTimers()
  })

  it('stops polling after cancel', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(
      makeDoneResponse({ status: 'transcribing', transcript_available: false, summary_available: false })
    )

    const onUpdate = vi.fn()
    const cancel = startStatusPolling('abc', onUpdate, 5000, 10)

    await vi.advanceTimersByTimeAsync(5100)
    expect(onUpdate).toHaveBeenCalledOnce()

    cancel()
    await vi.advanceTimersByTimeAsync(15000)
    expect(onUpdate).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})

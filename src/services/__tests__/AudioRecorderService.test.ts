import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioRecorderService, RecordingState } from '../AudioRecorderService'

// MediaRecorder stub
class MockMediaRecorder {
  state: string = 'inactive'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  start = vi.fn(() => { this.state = 'recording' })
  stop = vi.fn(() => {
    this.state = 'inactive'
    this.onstop?.()
  })
  pause = vi.fn(() => { this.state = 'paused' })
  resume = vi.fn(() => { this.state = 'recording' })
  static isTypeSupported = vi.fn(() => true)
}

const mockStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream

describe('AudioRecorderService', () => {
  let service: AudioRecorderService
  let MockRecorder: typeof MockMediaRecorder

  beforeEach(() => {
    MockRecorder = MockMediaRecorder
    vi.stubGlobal('MediaRecorder', MockRecorder)
    service = new AudioRecorderService()
  })

  it('starts in idle state', () => {
    expect(service.getState()).toBe(RecordingState.Idle)
  })

  it('transitions to recording after startRecording', async () => {
    await service.startRecording(mockStream)
    expect(service.getState()).toBe(RecordingState.Recording)
  })

  it('transitions to stopped after stopRecording and returns blob', async () => {
    await service.startRecording(mockStream)

    // Simulate data chunk available
    const recorder = (service as any).recorder as MockMediaRecorder
    recorder.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) })

    const blob = await service.stopRecording()
    expect(service.getState()).toBe(RecordingState.Stopped)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('records phase markers with timestamps', async () => {
    await service.startRecording(mockStream)
    service.markPhase('slotA', 0)
    service.markPhase('slotB', 300)
    const markers = service.getPhaseMarkers()
    expect(markers).toHaveLength(2)
    expect(markers[0].phaseType).toBe('slotA')
    expect(markers[1].elapsedSeconds).toBe(300)
  })
})

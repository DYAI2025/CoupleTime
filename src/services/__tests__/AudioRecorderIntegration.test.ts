import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioRecorderService, RecordingState } from '../AudioRecorderService'
import { PhaseType } from '../../domain/PhaseType'

class MockMediaRecorder {
  state = 'inactive'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  start = vi.fn(() => { this.state = 'recording' })
  stop = vi.fn(() => { this.state = 'inactive'; this.onstop?.() })
  static isTypeSupported = vi.fn(() => true)
}

const makeStream = () => ({ getTracks: () => [{ stop: vi.fn() }] }) as unknown as MediaStream

describe('AudioRecorderService — recording lifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('MediaRecorder', MockMediaRecorder)
  })

  it('is idle before session starts', () => {
    const svc = new AudioRecorderService()
    expect(svc.getState()).toBe(RecordingState.Idle)
  })

  it('enters Recording state after startRecording', async () => {
    const svc = new AudioRecorderService()
    await svc.startRecording(makeStream())
    expect(svc.getState()).toBe(RecordingState.Recording)
  })

  it('marks multiple phase transitions in order', async () => {
    const svc = new AudioRecorderService()
    await svc.startRecording(makeStream())
    svc.markPhase(PhaseType.Prep, 0)
    svc.markPhase(PhaseType.SlotA, 120)
    svc.markPhase(PhaseType.Transition, 420)
    const markers = svc.getPhaseMarkers()
    expect(markers).toHaveLength(3)
    expect(markers[0].phaseType).toBe(PhaseType.Prep)
    expect(markers[1].phaseType).toBe(PhaseType.SlotA)
    expect(markers[2].elapsedSeconds).toBe(420)
  })

  it('clears markers on new recording start', async () => {
    const svc = new AudioRecorderService()
    await svc.startRecording(makeStream())
    svc.markPhase(PhaseType.SlotA, 0)
    expect(svc.getPhaseMarkers()).toHaveLength(1)

    // Start a second recording — markers reset
    await svc.startRecording(makeStream())
    expect(svc.getPhaseMarkers()).toHaveLength(0)
  })

  it('returns blob with markers after stop', async () => {
    const svc = new AudioRecorderService()
    await svc.startRecording(makeStream())
    svc.markPhase(PhaseType.SlotA, 0)

    const recorder = (svc as any).recorder as MockMediaRecorder
    recorder.ondataavailable?.({ data: new Blob(['x'], { type: 'audio/webm' }) })

    const blob = await svc.stopRecording()
    expect(blob).toBeInstanceOf(Blob)
    expect(svc.getState()).toBe(RecordingState.Stopped)
    expect(svc.getPhaseMarkers()).toHaveLength(1)
  })
})

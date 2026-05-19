export enum RecordingState {
  Idle = 'idle',
  Recording = 'recording',
  Stopped = 'stopped',
}

export interface PhaseMarker {
  phaseType: string
  elapsedSeconds: number
  timestamp: number
}

export class AudioRecorderService {
  private state = RecordingState.Idle
  private recorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private markers: PhaseMarker[] = []

  getState(): RecordingState {
    return this.state
  }

  getPhaseMarkers(): PhaseMarker[] {
    return [...this.markers]
  }

  markPhase(phaseType: string, elapsedSeconds: number): void {
    this.markers.push({ phaseType, elapsedSeconds, timestamp: Date.now() })
  }

  async startRecording(stream: MediaStream): Promise<void> {
    this.chunks = []
    this.markers = []
    this.stream = stream

    const mimeType =
      MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
      MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
      MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
      ''

    this.recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start(1000)
    this.state = RecordingState.Recording
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        this.releaseStream()
        resolve(new Blob(this.chunks, { type: 'audio/webm' }))
        return
      }
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || 'audio/webm' })
        this.state = RecordingState.Stopped
        this.releaseStream()
        resolve(blob)
      }
      this.recorder.stop()
    })
  }

  private releaseStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}

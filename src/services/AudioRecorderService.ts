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
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    this.recorder = new MediaRecorder(stream, { mimeType })
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start(1000)
    this.state = RecordingState.Recording
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(new Blob([], { type: 'audio/webm' }))
        return
      }
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder!.mimeType || 'audio/webm' })
        this.state = RecordingState.Stopped
        resolve(blob)
      }
      this.recorder.stop()
    })
  }
}

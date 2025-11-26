import { AudioEvent } from '../domain/AudioEvent'

/**
 * Generates singing bowl-like sounds using Web Audio API
 * Each sound has unique characteristics based on real singing bowl acoustics
 */

interface BowlConfig {
  baseFrequency: number
  harmonics: number[]
  attackTime: number
  decayTime: number
  sustainLevel: number
  releaseTime: number
  strikes: number
  strikeDelay: number
}

const BOWL_CONFIGS: Record<AudioEvent, BowlConfig> = {
  // Deep single bowl - session start
  [AudioEvent.SessionStart]: {
    baseFrequency: 220,
    harmonics: [1, 2, 3, 4.5, 6],
    attackTime: 0.01,
    decayTime: 0.3,
    sustainLevel: 0.4,
    releaseTime: 4,
    strikes: 1,
    strikeDelay: 0,
  },
  // Rising tone - slot end
  [AudioEvent.SlotEnd]: {
    baseFrequency: 330,
    harmonics: [1, 2.5, 3, 5],
    attackTime: 0.01,
    decayTime: 0.2,
    sustainLevel: 0.5,
    releaseTime: 3,
    strikes: 1,
    strikeDelay: 0,
  },
  // Rising tone - slot start (after prep or transition)
  [AudioEvent.SlotStart]: {
    baseFrequency: 330, // Similar to SlotEnd but used specifically for start
    harmonics: [1, 2.5, 3, 5],
    attackTime: 0.01,
    decayTime: 0.2,
    sustainLevel: 0.5,
    releaseTime: 3,
    strikes: 1,
    strikeDelay: 0,
  },
  // Clear tone - transition end
  [AudioEvent.TransitionEnd]: {
    baseFrequency: 440,
    harmonics: [1, 2, 3],
    attackTime: 0.01,
    decayTime: 0.15,
    sustainLevel: 0.6,
    releaseTime: 2.5,
    strikes: 1,
    strikeDelay: 0,
  },
  // Double strike - closing start
  [AudioEvent.ClosingStart]: {
    baseFrequency: 392,
    harmonics: [1, 2, 3, 4],
    attackTime: 0.01,
    decayTime: 0.2,
    sustainLevel: 0.45,
    releaseTime: 2,
    strikes: 2,
    strikeDelay: 0.8,
  },
  // Fading tone - cooldown start
  [AudioEvent.CooldownStart]: {
    baseFrequency: 262,
    harmonics: [1, 2, 3, 4, 5, 6],
    attackTime: 0.02,
    decayTime: 0.5,
    sustainLevel: 0.3,
    releaseTime: 5,
    strikes: 1,
    strikeDelay: 0,
  },
  // Triple strike - cooldown end (session complete)
  [AudioEvent.CooldownEnd]: {
    baseFrequency: 523,
    harmonics: [1, 2, 3],
    attackTime: 0.01,
    decayTime: 0.15,
    sustainLevel: 0.5,
    releaseTime: 2,
    strikes: 3,
    strikeDelay: 0.5,
  },
}

export interface AudioServiceProtocol {
  play(event: AudioEvent): Promise<void>
  setVolume(volume: number): void
  getVolume(): number
  isEnabled(): boolean
  enable(): Promise<boolean>
}

class AudioServiceImpl implements AudioServiceProtocol {
  private audioContext: AudioContext | null = null
  private volume = 0.7
  private enabled = false

  async enable(): Promise<boolean> {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext()
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      this.enabled = true
      return true
    } catch {
      this.enabled = false
      return false
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.audioContext?.state === 'running'
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  getVolume(): number {
    return this.volume
  }

  async play(event: AudioEvent): Promise<void> {
    if (!this.audioContext || !this.enabled) {
      const success = await this.enable()
      if (!success) return
    }

    const config = BOWL_CONFIGS[event]
    if (!config || !this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    for (let strike = 0; strike < config.strikes; strike++) {
      const strikeTime = now + strike * config.strikeDelay
      this.playBowlStrike(ctx, config, strikeTime)
    }
  }

  private playBowlStrike(
    ctx: AudioContext,
    config: BowlConfig,
    startTime: number
  ): void {
    const masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
    masterGain.gain.value = this.volume

    // Create harmonics
    config.harmonics.forEach((harmonic, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = config.baseFrequency * harmonic

      // Higher harmonics decay faster
      const harmonicDecay = config.releaseTime / (1 + index * 0.3)

      // ADSR envelope
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(
        config.sustainLevel / (1 + index * 0.5),
        startTime + config.attackTime
      )
      gainNode.gain.exponentialRampToValueAtTime(
        config.sustainLevel * 0.5 / (1 + index * 0.5),
        startTime + config.attackTime + config.decayTime
      )
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + harmonicDecay
      )

      oscillator.connect(gainNode)
      gainNode.connect(masterGain)

      oscillator.start(startTime)
      oscillator.stop(startTime + harmonicDecay + 0.1)
    })

    // Add subtle shimmer/beating effect
    const shimmer = ctx.createOscillator()
    const shimmerGain = ctx.createGain()
    shimmer.type = 'sine'
    shimmer.frequency.value = config.baseFrequency * 1.003 // Slight detuning
    shimmerGain.gain.setValueAtTime(0, startTime)
    shimmerGain.gain.linearRampToValueAtTime(0.1, startTime + 0.5)
    shimmerGain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + config.releaseTime * 0.8
    )
    shimmer.connect(shimmerGain)
    shimmerGain.connect(masterGain)
    shimmer.start(startTime)
    shimmer.stop(startTime + config.releaseTime)
  }
}

// Singleton export
export const AudioService: AudioServiceProtocol = new AudioServiceImpl()

// For testing - allows injecting a mock
export const createMockAudioService = (): AudioServiceProtocol & {
  playedEvents: AudioEvent[]
  reset: () => void
} => {
  const playedEvents: AudioEvent[] = []
  let volume = 0.7
  let enabled = false

  return {
    playedEvents,
    reset: () => {
      playedEvents.length = 0
      enabled = false
    },
    async play(event: AudioEvent) {
      playedEvents.push(event)
    },
    setVolume(v: number) {
      volume = v
    },
    getVolume() {
      return volume
    },
    isEnabled() {
      return enabled
    },
    async enable() {
      enabled = true
      return true
    },
  }
}

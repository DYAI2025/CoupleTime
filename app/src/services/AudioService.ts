/**
 * AudioService – Singing bowl sounds via Web Audio API.
 * Falls back gracefully if AudioContext is not available.
 * No external files needed – sounds are synthesised.
 */

export type AudioEvent =
  | 'sessionStart'
  | 'slotStart'
  | 'slotEnd'
  | 'transitionEnd'
  | 'closingStart'
  | 'cooldownStart'
  | 'cooldownEnd'

interface BowlConfig {
  baseFreq: number
  harmonics: number[]
  attack: number
  decay: number
  sustain: number
  release: number
  strikes: number
  strikeDelay: number
}

const BOWL_CONFIGS: Record<AudioEvent, BowlConfig> = {
  sessionStart:  { baseFreq: 220, harmonics: [1, 2, 3, 4.5, 6],  attack: 0.01, decay: 0.3, sustain: 0.4, release: 4,   strikes: 1, strikeDelay: 0   },
  slotEnd:       { baseFreq: 330, harmonics: [1, 2.5, 3, 5],      attack: 0.01, decay: 0.2, sustain: 0.5, release: 3,   strikes: 1, strikeDelay: 0   },
  slotStart:     { baseFreq: 330, harmonics: [1, 2.5, 3, 5],      attack: 0.01, decay: 0.2, sustain: 0.5, release: 3,   strikes: 1, strikeDelay: 0   },
  transitionEnd: { baseFreq: 440, harmonics: [1, 2, 3],           attack: 0.01, decay: 0.15, sustain: 0.6, release: 2.5, strikes: 1, strikeDelay: 0  },
  closingStart:  { baseFreq: 392, harmonics: [1, 2, 3, 4],        attack: 0.01, decay: 0.2, sustain: 0.45, release: 2,  strikes: 2, strikeDelay: 0.8 },
  cooldownStart: { baseFreq: 262, harmonics: [1, 2, 3, 4, 5, 6],  attack: 0.02, decay: 0.5, sustain: 0.3, release: 5,   strikes: 1, strikeDelay: 0   },
  cooldownEnd:   { baseFreq: 523, harmonics: [1, 2, 3],           attack: 0.01, decay: 0.15, sustain: 0.5, release: 2,  strikes: 3, strikeDelay: 0.5 },
}

export interface AudioServiceProtocol {
  enable(): Promise<void>
  play(event: AudioEvent): Promise<void>
  isEnabled(): boolean
}

class AudioServiceImpl implements AudioServiceProtocol {
  private ctx: AudioContext | null = null
  private enabled = false

  async enable(): Promise<void> {
    if (this.enabled) return
    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }
      this.enabled = true
    } catch {
      console.warn('AudioService: Web Audio API not available')
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  async play(event: AudioEvent): Promise<void> {
    if (!this.enabled || !this.ctx) return
    const cfg = BOWL_CONFIGS[event]
    if (!cfg) return

    for (let s = 0; s < cfg.strikes; s++) {
      const delay = s * cfg.strikeDelay
      this._strike(cfg, delay)
    }
  }

  private _strike(cfg: BowlConfig, startDelay: number): void {
    if (!this.ctx) return
    const now = this.ctx.currentTime + startDelay

    cfg.harmonics.forEach((ratio, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()

      osc.type = 'sine'
      osc.frequency.value = cfg.baseFreq * ratio

      // Amplitude envelope
      const vol = 0.15 / (i + 1)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(vol, now + cfg.attack)
      gain.gain.exponentialRampToValueAtTime(vol * cfg.sustain, now + cfg.attack + cfg.decay)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.attack + cfg.decay + cfg.release)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(now)
      osc.stop(now + cfg.attack + cfg.decay + cfg.release + 0.1)
    })
  }
}

let _instance: AudioServiceImpl | null = null
export function getAudioService(): AudioServiceProtocol {
  if (!_instance) _instance = new AudioServiceImpl()
  return _instance
}

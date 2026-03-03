/**
 * AudioService – Web Audio API synthesized sounds.
 * Supports all 7 SoundTypes from Stoppclock + 7 AudioEvents for phase transitions.
 */

import type { SoundType } from '@/domain/PhaseConfig'

export type AudioEvent =
  | 'sessionStart' | 'slotStart' | 'slotEnd'
  | 'transitionEnd' | 'closingStart' | 'cooldownStart' | 'cooldownEnd'

interface BowlConfig {
  baseFreq: number; harmonics: number[]
  attack: number; decay: number; sustain: number; release: number
  strikes: number; strikeDelay: number
}

const BOWL_CONFIGS: Record<AudioEvent, BowlConfig> = {
  sessionStart:  { baseFreq: 220, harmonics: [1,2,3,4.5,6], attack:.01, decay:.3, sustain:.4, release:4, strikes:1, strikeDelay:0 },
  slotEnd:       { baseFreq: 330, harmonics: [1,2.5,3,5],   attack:.01, decay:.2, sustain:.5, release:3, strikes:1, strikeDelay:0 },
  slotStart:     { baseFreq: 330, harmonics: [1,2.5,3,5],   attack:.01, decay:.2, sustain:.5, release:3, strikes:1, strikeDelay:0 },
  transitionEnd: { baseFreq: 440, harmonics: [1,2,3],       attack:.01, decay:.15,sustain:.6, release:2.5,strikes:1,strikeDelay:0 },
  closingStart:  { baseFreq: 392, harmonics: [1,2,3,4],     attack:.01, decay:.2, sustain:.45,release:2, strikes:2, strikeDelay:.8 },
  cooldownStart: { baseFreq: 262, harmonics: [1,2,3,4,5,6], attack:.02, decay:.5, sustain:.3, release:5, strikes:1, strikeDelay:0 },
  cooldownEnd:   { baseFreq: 523, harmonics: [1,2,3],       attack:.01, decay:.15,sustain:.5, release:2, strikes:3, strikeDelay:.5 },
}

// Map SoundType → bowl freq for custom phases
const SOUND_TYPE_FREQ: Record<SoundType, number> = {
  BELL:        660,
  GONG:        110,
  SINGING_BOWL:396,
  SIREN:       880,
  ALARM:       440,
  WOOSH:       220,
  HORN:        196,
}

export interface AudioServiceProtocol {
  enable(): Promise<void>
  play(event: AudioEvent): Promise<void>
  playSound(type: SoundType): Promise<void>
  isEnabled(): boolean
}

class AudioServiceImpl implements AudioServiceProtocol {
  private ctx: AudioContext | null = null
  private enabled = false

  async enable(): Promise<void> {
    if (this.enabled) return
    try {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      if (this.ctx.state === 'suspended') await this.ctx.resume()
      this.enabled = true
    } catch { console.warn('AudioService: Web Audio API unavailable') }
  }

  isEnabled() { return this.enabled }

  async play(event: AudioEvent): Promise<void> {
    if (!this.enabled || !this.ctx) return
    this._bowl(BOWL_CONFIGS[event])
  }

  async playSound(type: SoundType): Promise<void> {
    if (!this.enabled || !this.ctx) return
    const freq = SOUND_TYPE_FREQ[type]
    if (type === 'WOOSH') { this._woosh(); return }
    if (type === 'SIREN') { this._siren(); return }
    if (type === 'ALARM') { this._alarm(); return }
    if (type === 'HORN')  { this._horn();  return }
    // BELL / GONG / SINGING_BOWL → bowl with different freq
    this._bowl({
      baseFreq: freq,
      harmonics: type === 'GONG' ? [1,2,3] : type === 'SINGING_BOWL' ? [1,2.5,3,4.5] : [1,2],
      attack: .01, decay: type === 'GONG' ? .3 : .15,
      sustain: type === 'GONG' ? .3 : .5,
      release: type === 'GONG' ? 3 : 1.5,
      strikes: 1, strikeDelay: 0,
    })
  }

  private _bowl(cfg: BowlConfig) {
    for (let s = 0; s < cfg.strikes; s++) this._strike(cfg, s * cfg.strikeDelay)
  }

  private _strike(cfg: BowlConfig, startDelay: number) {
    if (!this.ctx) return
    const now = this.ctx.currentTime + startDelay
    cfg.harmonics.forEach((ratio, i) => {
      const osc  = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = cfg.baseFreq * ratio
      const vol = 0.15 / (i + 1)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(vol, now + cfg.attack)
      gain.gain.exponentialRampToValueAtTime(vol * cfg.sustain, now + cfg.attack + cfg.decay)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.attack + cfg.decay + cfg.release)
      osc.connect(gain); gain.connect(this.ctx!.destination)
      osc.start(now); osc.stop(now + cfg.attack + cfg.decay + cfg.release + .1)
    })
  }

  private _woosh() {
    if (!this.ctx) return
    const noise = this.ctx.createOscillator()
    const gain  = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'; filter.frequency.value = 1000; filter.Q.value = 0.5
    noise.type = 'sawtooth'; noise.frequency.value = 300
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(.15, this.ctx.currentTime + .1)
    gain.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + .5)
    noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination)
    noise.start(); noise.stop(this.ctx.currentTime + .5)
  }

  private _siren() {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, this.ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + .3)
    osc.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + .6)
    gain.gain.setValueAtTime(.2, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + .7)
    osc.connect(gain); gain.connect(this.ctx.destination)
    osc.start(); osc.stop(this.ctx.currentTime + .7)
  }

  private _alarm() {
    if (!this.ctx) return
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const t = this.ctx.currentTime + i * 0.2
      osc.type = 'square'; osc.frequency.value = 440
      gain.gain.setValueAtTime(.1, t)
      gain.gain.exponentialRampToValueAtTime(.0001, t + .15)
      osc.connect(gain); gain.connect(this.ctx.destination)
      osc.start(t); osc.stop(t + .15)
    }
  }

  private _horn() {
    if (!this.ctx) return
    const osc  = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'; osc.frequency.value = 196
    gain.gain.setValueAtTime(0, this.ctx.currentTime)
    gain.gain.linearRampToValueAtTime(.25, this.ctx.currentTime + .05)
    gain.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + 1.2)
    osc.connect(gain); gain.connect(this.ctx.destination)
    osc.start(); osc.stop(this.ctx.currentTime + 1.2)
  }
}

let _instance: AudioServiceImpl | null = null
export function getAudioService(): AudioServiceProtocol {
  if (!_instance) _instance = new AudioServiceImpl()
  return _instance
}

export const SOUND_LABELS: Record<SoundType, string> = {
  BELL:        '🔔 Glocke',
  GONG:        '🥁 Gong',
  SINGING_BOWL:'🎵 Klangschale',
  SIREN:       '🚨 Signal',
  ALARM:       '⏰ Alarm',
  WOOSH:       '💨 Woosh',
  HORN:        '📯 Horn',
}

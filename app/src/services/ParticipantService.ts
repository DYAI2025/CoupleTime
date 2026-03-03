/**
 * ParticipantService – stores partner names + transition time in localStorage.
 */

const KEY = 'ct.v1.participant'

export interface ParticipantConfig {
  nameA: string
  nameB: string
  transitionSec: number   // 5–300
}

const DEFAULTS: ParticipantConfig = {
  nameA: 'Partner A',
  nameB: 'Partner B',
  transitionSec: 60,
}

function load(): ParticipantConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Partial<ParticipantConfig>
    return {
      nameA:         p.nameA         || DEFAULTS.nameA,
      nameB:         p.nameB         || DEFAULTS.nameB,
      transitionSec: p.transitionSec ?? DEFAULTS.transitionSec,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(config: ParticipantConfig) {
  try { localStorage.setItem(KEY, JSON.stringify(config)) } catch { /* */ }
}

class ParticipantServiceImpl {
  private config: ParticipantConfig = load()

  get(): ParticipantConfig { return { ...this.config } }

  setNames(nameA: string, nameB: string) {
    this.config = { ...this.config, nameA: nameA || DEFAULTS.nameA, nameB: nameB || DEFAULTS.nameB }
    save(this.config)
  }

  setTransitionSec(sec: number) {
    const clamped = Math.min(300, Math.max(5, Math.round(sec)))
    this.config = { ...this.config, transitionSec: clamped }
    save(this.config)
  }

  reset() {
    this.config = { ...DEFAULTS }
    save(this.config)
  }
}

let _instance: ParticipantServiceImpl | null = null
export function getParticipantService(): ParticipantServiceImpl {
  if (!_instance) _instance = new ParticipantServiceImpl()
  return _instance
}

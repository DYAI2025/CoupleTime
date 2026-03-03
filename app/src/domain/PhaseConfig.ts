import type { PhaseType } from "./PhaseType";
import type { Speaker } from "./Speaker";
import { getSpeakerForPhase } from "./Speaker";

export type SoundType =
  | 'BELL'
  | 'GONG'
  | 'SINGING_BOWL'
  | 'SIREN'
  | 'ALARM'
  | 'WOOSH'
  | 'HORN'

export interface PhaseConfig {
  id: string
  type: PhaseType
  duration: number         // seconds
  allowedRange: { min: number; max: number }
  /** Custom label shown during this phase (overrides auto-label) */
  label?: string
  /** Focus instruction shown large on screen during this phase */
  focusText?: string
  /** Sound played when this phase ends (default: auto by phase type) */
  soundType?: SoundType
}

export function createPhaseConfig(
  id: string,
  type: PhaseType,
  duration: number,
  allowedRange?: { min: number; max: number },
  extra?: { label?: string; focusText?: string; soundType?: SoundType }
): PhaseConfig {
  const defaultRanges: Record<PhaseType, { min: number; max: number }> = {
    prep:       { min: 0,   max: 600  },
    slotA:      { min: 30,  max: 3600 },
    slotB:      { min: 30,  max: 3600 },
    transition: { min: 0,   max: 600  },
    closingA:   { min: 0,   max: 600  },
    closingB:   { min: 0,   max: 600  },
    cooldown:   { min: 0,   max: 3600 },
  }
  return {
    id,
    type,
    duration,
    allowedRange: allowedRange ?? defaultRanges[type],
    ...extra,
  }
}

export function isValidPhaseConfig(phase: PhaseConfig): boolean {
  return phase.duration >= phase.allowedRange.min && phase.duration <= phase.allowedRange.max
}

export function getPhaseSpeaker(phase: PhaseConfig): Speaker {
  return getSpeakerForPhase(phase.type)
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const rem = mins % 60
    return `${hours}:${rem.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDurationShort(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const rem = mins % 60
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
  }
  if (mins === 0) return `${seconds}s`
  const secs = seconds % 60
  return secs > 0 ? `${mins} min ${secs}s` : `${mins} min`
}

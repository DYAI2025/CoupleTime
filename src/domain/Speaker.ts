import { PhaseType, isPartnerAPhase, isPartnerBPhase } from './PhaseType'

/**
 * Represents which partner is the current speaker
 */
export enum Speaker {
  A = 'a',
  B = 'b',
  None = 'none',
}

/**
 * Get the speaker for a given phase type
 */
export function getSpeakerForPhase(phase: PhaseType): Speaker {
  if (isPartnerAPhase(phase)) {
    return Speaker.A
  }
  if (isPartnerBPhase(phase)) {
    return Speaker.B
  }
  return Speaker.None
}

/**
 * Get the other speaker (A → B, B → A)
 */
export function getOtherSpeaker(speaker: Speaker): Speaker {
  if (speaker === Speaker.A) return Speaker.B
  if (speaker === Speaker.B) return Speaker.A
  return Speaker.None
}

/**
 * Get i18n key for speaker label
 */
export function getSpeakerI18nKey(speaker: Speaker): string {
  if (speaker === Speaker.None) return ''
  return `speakers.${speaker}`
}

/**
 * Get display name for speaker (fallback for i18n)
 */
export function getSpeakerDisplayName(speaker: Speaker): string {
  switch (speaker) {
    case Speaker.A:
      return 'Partner A'
    case Speaker.B:
      return 'Partner B'
    case Speaker.None:
      return ''
  }
}

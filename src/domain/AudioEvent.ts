/**
 * Audio events triggered during a session
 * Each event maps to a specific singing bowl sound
 */
export enum AudioEvent {
  /** Deep single bowl - marks session beginning */
  SessionStart = 'sessionStart',

  /** Rising tone - speaking slot ended */
  SlotEnd = 'slotEnd',

  /** Clear tone - transition phase ended */
  TransitionEnd = 'transitionEnd',

  /** Double strike - closing phase starting */
  ClosingStart = 'closingStart',

  /** Fading tone - cooldown phase starting */
  CooldownStart = 'cooldownStart',

  /** Triple strike - session complete */
  CooldownEnd = 'cooldownEnd',
}

/** Maps AudioEvent to descriptive filename (for documentation) */
export const AUDIO_EVENT_FILES: Record<AudioEvent, string> = {
  [AudioEvent.SessionStart]: 'bowl_deep_single',
  [AudioEvent.SlotEnd]: 'bowl_rising',
  [AudioEvent.TransitionEnd]: 'bowl_clear',
  [AudioEvent.ClosingStart]: 'bowl_double',
  [AudioEvent.CooldownStart]: 'bowl_fade',
  [AudioEvent.CooldownEnd]: 'bowl_triple',
}

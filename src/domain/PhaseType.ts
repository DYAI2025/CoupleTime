/**
 * Types of phases in a session
 */
export enum PhaseType {
  /** Preparation phase - getting ready */
  Prep = 'prep',

  /** Speaking slot for Partner A */
  SlotA = 'slotA',

  /** Speaking slot for Partner B */
  SlotB = 'slotB',

  /** Transition between rounds */
  Transition = 'transition',

  /** Closing statement for Partner A */
  ClosingA = 'closingA',

  /** Closing statement for Partner B */
  ClosingB = 'closingB',

  /** Cooldown - no discussion period */
  Cooldown = 'cooldown',
}

/**
 * Check if a phase is a speaking phase (slotA, slotB, closingA, closingB)
 */
export function isSpeakingPhase(phase: PhaseType): boolean {
  return [
    PhaseType.SlotA,
    PhaseType.SlotB,
    PhaseType.ClosingA,
    PhaseType.ClosingB,
  ].includes(phase)
}

/**
 * Check if a phase is for Partner A
 */
export function isPartnerAPhase(phase: PhaseType): boolean {
  return phase === PhaseType.SlotA || phase === PhaseType.ClosingA
}

/**
 * Check if a phase is for Partner B
 */
export function isPartnerBPhase(phase: PhaseType): boolean {
  return phase === PhaseType.SlotB || phase === PhaseType.ClosingB
}

/**
 * Get all phase types in order of typical appearance
 */
export function getAllPhaseTypes(): PhaseType[] {
  return [
    PhaseType.Prep,
    PhaseType.SlotA,
    PhaseType.SlotB,
    PhaseType.Transition,
    PhaseType.ClosingA,
    PhaseType.ClosingB,
    PhaseType.Cooldown,
  ]
}

/**
 * Get i18n key for a phase type
 */
export function getPhaseI18nKey(phase: PhaseType): string {
  return `phases.${phase}`
}

/**
 * Get display name for a phase type (fallback for i18n)
 */
export function getPhaseDisplayName(phase: PhaseType): string {
  switch (phase) {
    case PhaseType.Prep:
      return 'Preparation'
    case PhaseType.SlotA:
      return 'Partner A speaks'
    case PhaseType.SlotB:
      return 'Partner B speaks'
    case PhaseType.Transition:
      return 'Transition'
    case PhaseType.ClosingA:
      return 'Partner A closing'
    case PhaseType.ClosingB:
      return 'Partner B closing'
    case PhaseType.Cooldown:
      return 'Cooldown'
  }
}

/**
 * Phase colors for UI
 */
const PHASE_COLORS: Record<PhaseType, string> = {
  [PhaseType.Prep]: 'slate',
  [PhaseType.SlotA]: 'blue',
  [PhaseType.SlotB]: 'rose',
  [PhaseType.Transition]: 'amber',
  [PhaseType.ClosingA]: 'blue',
  [PhaseType.ClosingB]: 'rose',
  [PhaseType.Cooldown]: 'emerald',
}

/**
 * Get color identifier for a phase type
 */
export function getPhaseColor(phase: PhaseType): string {
  return PHASE_COLORS[phase]
}

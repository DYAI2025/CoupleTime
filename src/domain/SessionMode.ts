import { PhaseConfig, calculateTotalDuration, formatDuration, isPhaseConfigValid } from './PhaseConfig'
import { PhaseType } from './PhaseType'
import { GuidanceLevel } from './GuidanceLevel'

/**
 * Represents a session mode (preset or custom)
 */
export interface SessionMode {
  /** Unique identifier */
  id: string

  /** Display name (i18n key for presets, user-defined for custom) */
  name: string

  /** Description (i18n key for presets) */
  description?: string

  /** Sequence of phases */
  phases: PhaseConfig[]

  /** Guidance level for tips display */
  guidanceLevel: GuidanceLevel

  /** Whether this is a locked preset (cannot be edited) */
  isLocked: boolean

  /** Timestamp when created/modified (for custom modes) */
  createdAt?: number
}

/**
 * Mode type identifier for presets
 */
export type PresetModeId = 'maintain' | 'commitment' | 'listening'

/**
 * Check if a session mode has at least one slotA phase
 */
export function hasSlotA(mode: SessionMode): boolean {
  return mode.phases.some((p) => p.type === PhaseType.SlotA)
}

/**
 * Check if a session mode has at least one slotB phase
 */
export function hasSlotB(mode: SessionMode): boolean {
  return mode.phases.some((p) => p.type === PhaseType.SlotB)
}

/**
 * Check if a session mode is valid
 * - Must have at least one slotA
 * - Must have at least one slotB
 * - All phases must have valid durations
 */
export function isSessionModeValid(mode: SessionMode): boolean {
  if (!hasSlotA(mode)) return false
  if (!hasSlotB(mode)) return false
  if (mode.phases.length === 0) return false

  return mode.phases.every(isPhaseConfigValid)
}

/**
 * Get validation errors for a session mode
 */
export function getValidationErrors(mode: SessionMode): string[] {
  const errors: string[] = []

  if (!hasSlotA(mode)) {
    errors.push('builder.validation.needSlotA')
  }
  if (!hasSlotB(mode)) {
    errors.push('builder.validation.needSlotB')
  }

  mode.phases.forEach((phase, index) => {
    if (!isPhaseConfigValid(phase)) {
      errors.push(`Phase ${index + 1} has invalid duration`)
    }
  })

  return errors
}

/**
 * Calculate total duration of a session mode in seconds
 */
export function getTotalDuration(mode: SessionMode): number {
  return calculateTotalDuration(mode.phases)
}

/**
 * Get formatted total duration string
 */
export function getFormattedTotalDuration(mode: SessionMode): string {
  return formatDuration(getTotalDuration(mode))
}

/**
 * Get total duration in minutes (rounded)
 */
export function getTotalDurationMinutes(mode: SessionMode): number {
  return Math.round(getTotalDuration(mode) / 60)
}

/**
 * Count the number of A/B round pairs
 * A round is counted as one slotA + one slotB
 */
export function getRoundCount(mode: SessionMode): number {
  const slotACount = mode.phases.filter((p) => p.type === PhaseType.SlotA).length
  const slotBCount = mode.phases.filter((p) => p.type === PhaseType.SlotB).length
  return Math.min(slotACount, slotBCount)
}

/**
 * Get i18n key for mode name
 */
export function getModeNameI18nKey(modeId: string): string {
  return `modes.${modeId}.name`
}

/**
 * Get i18n key for mode description
 */
export function getModeDescriptionI18nKey(modeId: string): string {
  return `modes.${modeId}.description`
}

/**
 * Create a new custom session mode
 */
export function createCustomMode(
  name: string,
  phases: PhaseConfig[],
  guidanceLevel: GuidanceLevel = GuidanceLevel.Moderate
): SessionMode {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    phases,
    guidanceLevel,
    isLocked: false,
    createdAt: Date.now(),
  }
}

/**
 * Clone a session mode with a new id
 */
export function cloneMode(mode: SessionMode, newName?: string): SessionMode {
  return {
    ...mode,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: newName ?? `${mode.name} (Copy)`,
    isLocked: false,
    createdAt: Date.now(),
    phases: mode.phases.map((p) => ({ ...p, id: `${p.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })),
  }
}

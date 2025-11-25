import { PhaseType } from './PhaseType'

/**
 * Allowed duration ranges for each phase type (in seconds)
 * Based on the verbindliche Preset-Definitionen
 */
export const PHASE_DURATION_RANGES: Record<PhaseType, { min: number; max: number }> = {
  [PhaseType.Prep]: { min: 30, max: 600 },
  [PhaseType.SlotA]: { min: 300, max: 1800 },
  [PhaseType.SlotB]: { min: 300, max: 1800 },
  [PhaseType.Transition]: { min: 30, max: 300 },
  [PhaseType.ClosingA]: { min: 60, max: 600 },
  [PhaseType.ClosingB]: { min: 60, max: 600 },
  [PhaseType.Cooldown]: { min: 300, max: 1800 },
}

/**
 * Configuration for a single phase in a session
 */
export interface PhaseConfig {
  /** Unique identifier for this phase instance */
  id: string

  /** Type of phase */
  type: PhaseType

  /** Duration in seconds */
  duration: number
}

/**
 * Create a new phase config
 */
export function createPhaseConfig(
  type: PhaseType,
  duration: number,
  id?: string
): PhaseConfig {
  return {
    id: id ?? `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    duration,
  }
}

/**
 * Get the allowed duration range for a phase type
 */
export function getAllowedRange(type: PhaseType): { min: number; max: number } {
  return PHASE_DURATION_RANGES[type]
}

/**
 * Check if a phase config's duration is within the allowed range
 */
export function isPhaseConfigValid(config: PhaseConfig): boolean {
  const range = getAllowedRange(config.type)
  return config.duration >= range.min && config.duration <= range.max
}

/**
 * Clamp a duration to the allowed range for a phase type
 */
export function clampDuration(type: PhaseType, duration: number): number {
  const range = getAllowedRange(type)
  return Math.max(range.min, Math.min(range.max, duration))
}

/**
 * Format duration in seconds to a display string
 * @param seconds Duration in seconds
 * @returns Formatted string like "15:00" or "1:30:00"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format duration for display in minutes (rounded)
 */
export function formatDurationMinutes(seconds: number): number {
  return Math.round(seconds / 60)
}

/**
 * Parse a duration string (MM:SS or H:MM:SS) to seconds
 */
export function parseDuration(formatted: string): number {
  const parts = formatted.split(':').map(Number)

  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1]
  }
  return 0
}

/**
 * Calculate total duration from a list of phase configs
 */
export function calculateTotalDuration(phases: PhaseConfig[]): number {
  return phases.reduce((total, phase) => total + phase.duration, 0)
}

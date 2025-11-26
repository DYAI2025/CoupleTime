import { Speaker } from './Speaker'

/**
 * Configuration for participant names and colors
 */
export interface ParticipantConfig {
  /** Name of Partner A */
  nameA: string

  /** Name of Partner B */
  nameB: string

  /** Hex color for Partner A (e.g., '#3B82F6') */
  colorA: string

  /** Hex color for Partner B (e.g., '#F43F5E') */
  colorB: string
}

/**
 * Default participant configuration
 */
export const DEFAULT_PARTICIPANT_CONFIG: ParticipantConfig = {
  nameA: 'Partner A',
  nameB: 'Partner B',
  colorA: '#3B82F6', // blue-500
  colorB: '#F43F5E', // rose-500
}

/**
 * Palette of calm, accessible colors for participant selection
 */
export const PARTICIPANT_COLOR_PALETTE = [
  { name: 'Ocean Blue', value: '#3B82F6', dark: '#1E40AF' },
  { name: 'Warm Rose', value: '#F43F5E', dark: '#BE123C' },
  { name: 'Soft Violet', value: '#8B5CF6', dark: '#6D28D9' },
  { name: 'Gentle Teal', value: '#14B8A6', dark: '#0F766E' },
  { name: 'Calm Amber', value: '#F59E0B', dark: '#B45309' },
  { name: 'Peaceful Green', value: '#10B981', dark: '#047857' },
  { name: 'Serene Indigo', value: '#6366F1', dark: '#4338CA' },
  { name: 'Tender Pink', value: '#EC4899', dark: '#BE185D' },
]

/**
 * Get participant name for a given speaker
 */
export function getParticipantName(
  speaker: Speaker,
  config: ParticipantConfig
): string {
  switch (speaker) {
    case Speaker.A:
      return config.nameA
    case Speaker.B:
      return config.nameB
    case Speaker.None:
      return ''
  }
}

/**
 * Get participant color for a given speaker
 */
export function getParticipantColor(
  speaker: Speaker,
  config: ParticipantConfig
): string {
  switch (speaker) {
    case Speaker.A:
      return config.colorA
    case Speaker.B:
      return config.colorB
    case Speaker.None:
      return ''
  }
}

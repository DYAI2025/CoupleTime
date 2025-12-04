/**
 * Configuration for session participants
 * Contains names and colors for both participants
 */
export interface ParticipantConfig {
  nameA: string;
  nameB: string;
  colorA: string;
  colorB: string;
}

/**
 * Creates a default participant configuration
 * with default names and colors
 */
export function createDefaultParticipantConfig(): ParticipantConfig {
  return {
    nameA: 'Partner A',
    nameB: 'Partner B',
    colorA: '#3b82f6', // blue-500
    colorB: '#8b5cf6', // violet-500
  };
}
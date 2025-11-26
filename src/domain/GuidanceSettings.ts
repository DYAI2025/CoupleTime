/**
 * Guidance display mode
 */
export type GuidanceMode = 'quick' | 'deep-dive'

/**
 * Settings for guidance panel behavior
 */
export interface GuidanceSettings {
  /** Show all tips in shuffled rotation */
  showAllTips: boolean

  /** Current guidance mode */
  guidanceMode: GuidanceMode

  /** Enable guidance in Maintain mode */
  enableInMaintain: boolean

  /** Auto-rotation interval in seconds */
  autoRotateInterval: number
}

/**
 * Default guidance settings
 */
export const DEFAULT_GUIDANCE_SETTINGS: GuidanceSettings = {
  showAllTips: false,
  guidanceMode: 'quick',
  enableInMaintain: false,
  autoRotateInterval: 20,
}

/**
 * Create guidance settings with optional overrides
 */
export function createGuidanceSettings(
  partial?: Partial<GuidanceSettings>
): GuidanceSettings {
  return { ...DEFAULT_GUIDANCE_SETTINGS, ...partial }
}

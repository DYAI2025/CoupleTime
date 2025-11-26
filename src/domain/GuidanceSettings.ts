/**
 * Configuration for guidance display settings
 */
export interface GuidanceSettings {
  /** Enable guidance tips in Maintain mode (otherwise disabled) */
  enableInMaintain: boolean

  /** Show all available tips during the session */
  showAllTips: boolean

  /** Auto-rotate interval in seconds (10-60) */
  autoRotateInterval: number

  /** Guidance mode (quick tips or deep dive) */
  guidanceMode: 'quick' | 'deep-dive'
}

/**
 * Default guidance settings
 */
export const DEFAULT_GUIDANCE_SETTINGS: GuidanceSettings = {
  enableInMaintain: true,
  showAllTips: false,
  autoRotateInterval: 30,
  guidanceMode: 'quick',
}

/**
 * Validate guidance settings
 */
export function isValidGuidanceSettings(settings: any): settings is GuidanceSettings {
  return (
    typeof settings === 'object' &&
    typeof settings.enableInMaintain === 'boolean' &&
    typeof settings.showAllTips === 'boolean' &&
    typeof settings.autoRotateInterval === 'number' &&
    settings.autoRotateInterval >= 10 &&
    settings.autoRotateInterval <= 60 &&
    (settings.guidanceMode === 'quick' || settings.guidanceMode === 'deep-dive')
  )
}

/**
 * Configuration for guidance settings
 * Controls tip behavior during sessions
 */
export interface GuidanceSettings {
  enableInMaintain: boolean;
  showAllTips: boolean;
  autoRotateInterval: number;
  guidanceMode: 'quick' | 'deep-dive';
}

/**
 * Default guidance settings
 */
export const DEFAULT_GUIDANCE_SETTINGS: GuidanceSettings = {
  enableInMaintain: false,
  showAllTips: false,
  autoRotateInterval: 20,
  guidanceMode: 'quick',
}

/**
 * Create guidance settings with optional overrides
 * Useful for tests and creating settings objects programmatically
 */
export function createGuidanceSettings(partial?: Partial<GuidanceSettings>): GuidanceSettings {
  return { ...DEFAULT_GUIDANCE_SETTINGS, ...partial }
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

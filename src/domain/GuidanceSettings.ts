/**
 * Configuration for guidance settings
 * Controls tip behavior during sessions
 */
export interface GuidanceSettings {
  autoRotation: boolean;
  interval: number; // in seconds
  showAll: boolean;
  enableInMaintain: boolean;
  showAllTips: boolean;
  autoRotateInterval: number;
  guidanceMode: 'quick' | 'deep-dive';
}

/**
 * Default guidance settings
 */
export const DEFAULT_GUIDANCE_SETTINGS: GuidanceSettings = {
  autoRotation: true,
  interval: 25, // seconds
  showAll: false,
  enableInMaintain: true,
  showAllTips: false,
  autoRotateInterval: 30,
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
    typeof settings.autoRotation === 'boolean' &&
    typeof settings.interval === 'number' &&
    settings.interval >= 10 &&
    settings.interval <= 60 &&
    typeof settings.showAll === 'boolean' &&
    typeof settings.enableInMaintain === 'boolean' &&
    typeof settings.showAllTips === 'boolean' &&
    typeof settings.autoRotateInterval === 'number' &&
    settings.autoRotateInterval >= 10 &&
    settings.autoRotateInterval <= 60 &&
    (settings.guidanceMode === 'quick' || settings.guidanceMode === 'deep-dive')
  )
}

/**
 * Guidance level determines how much help/tips are shown during a session
 */
export enum GuidanceLevel {
  /** Minimal guidance - only cooldown tips */
  Minimal = 'minimal',

  /** Moderate guidance - transition and cooldown tips */
  Moderate = 'moderate',

  /** High guidance - prep, transition, and cooldown tips */
  High = 'high',
}

/**
 * Configuration for what tips to show at each guidance level
 */
export interface GuidanceConfig {
  /** Show tips during prep phase */
  showPrepTips: boolean

  /** Show tips during transition phases */
  showTransitionTips: boolean

  /** Show tips during cooldown (always true) */
  showCooldownTips: boolean

  /** Show breathing exercise suggestion */
  showBreathingExercise: boolean
}

/**
 * Get guidance configuration for a given level
 */
export function getGuidanceConfig(level: GuidanceLevel): GuidanceConfig {
  switch (level) {
    case GuidanceLevel.Minimal:
      return {
        showPrepTips: false,
        showTransitionTips: false,
        showCooldownTips: true, // Always show cooldown tips
        showBreathingExercise: false,
      }
    case GuidanceLevel.Moderate:
      return {
        showPrepTips: false,
        showTransitionTips: true,
        showCooldownTips: true,
        showBreathingExercise: false,
      }
    case GuidanceLevel.High:
      return {
        showPrepTips: true,
        showTransitionTips: true,
        showCooldownTips: true,
        showBreathingExercise: true,
      }
  }
}

/**
 * Check if prep tips should be shown for a guidance level
 */
export function shouldShowPrepTips(level: GuidanceLevel): boolean {
  return getGuidanceConfig(level).showPrepTips
}

/**
 * Check if transition tips should be shown for a guidance level
 */
export function shouldShowTransitionTips(level: GuidanceLevel): boolean {
  return getGuidanceConfig(level).showTransitionTips
}

/**
 * Check if cooldown tips should be shown (always true, but provided for consistency)
 */
export function shouldShowCooldownTips(_level: GuidanceLevel): boolean {
  return true // Cooldown tips are always shown
}

/**
 * Get i18n key for guidance level name
 */
export function getGuidanceLevelI18nKey(level: GuidanceLevel): string {
  return `guidanceLevel.${level}`
}

/**
 * Get all guidance levels
 */
export function getAllGuidanceLevels(): GuidanceLevel[] {
  return [GuidanceLevel.Minimal, GuidanceLevel.Moderate, GuidanceLevel.High]
}

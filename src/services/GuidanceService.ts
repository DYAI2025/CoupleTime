import { PhaseType } from '../domain/PhaseType'
import { GuidanceLevel, getGuidanceConfig } from '../domain/GuidanceLevel'

/**
 * Guidance tip categories matching i18n structure
 */
export type TipCategory = 'prep' | 'transition' | 'cooldown'

/**
 * Map PhaseType to TipCategory
 */
export function getTipCategoryForPhase(phase: PhaseType): TipCategory | null {
  switch (phase) {
    case PhaseType.Prep:
      return 'prep'
    case PhaseType.Transition:
      return 'transition'
    case PhaseType.Cooldown:
      return 'cooldown'
    default:
      return null
  }
}

/**
 * Number of tips available per category (must match i18n files)
 */
const TIPS_PER_CATEGORY = 5

/**
 * Get all i18n keys for tips in a category
 */
export function getTipKeys(category: TipCategory): string[] {
  const keys: string[] = []
  for (let i = 1; i <= TIPS_PER_CATEGORY; i++) {
    keys.push(`guidance.${category}.tip${i}`)
  }
  return keys
}

/**
 * Get a random tip key from a category
 */
export function getRandomTipKey(category: TipCategory): string {
  const index = Math.floor(Math.random() * TIPS_PER_CATEGORY) + 1
  return `guidance.${category}.tip${index}`
}

/**
 * Check if tips should be shown for a phase at a given guidance level
 */
export function shouldShowTips(phase: PhaseType, level: GuidanceLevel): boolean {
  const config = getGuidanceConfig(level)
  const category = getTipCategoryForPhase(phase)

  if (!category) return false

  switch (category) {
    case 'prep':
      return config.showPrepTips
    case 'transition':
      return config.showTransitionTips
    case 'cooldown':
      return config.showCooldownTips
  }
}

/**
 * GuidanceService protocol
 */
export interface GuidanceServiceProtocol {
  /** Get tips for a phase at a guidance level */
  getTipsForPhase(phase: PhaseType, level: GuidanceLevel): string[]

  /** Get a single random tip for a phase */
  getRandomTip(phase: PhaseType, level: GuidanceLevel): string | null

  /** Check if tips should be shown */
  shouldShowTips(phase: PhaseType, level: GuidanceLevel): boolean
}

class GuidanceServiceImpl implements GuidanceServiceProtocol {
  getTipsForPhase(phase: PhaseType, level: GuidanceLevel): string[] {
    if (!shouldShowTips(phase, level)) {
      return []
    }

    const category = getTipCategoryForPhase(phase)
    if (!category) return []

    return getTipKeys(category)
  }

  getRandomTip(phase: PhaseType, level: GuidanceLevel): string | null {
    if (!shouldShowTips(phase, level)) {
      return null
    }

    const category = getTipCategoryForPhase(phase)
    if (!category) return null

    return getRandomTipKey(category)
  }

  shouldShowTips(phase: PhaseType, level: GuidanceLevel): boolean {
    return shouldShowTips(phase, level)
  }
}

// Singleton export
export const GuidanceService: GuidanceServiceProtocol = new GuidanceServiceImpl()

/**
 * Create mock for testing
 */
export function createMockGuidanceService(): GuidanceServiceProtocol {
  return {
    getTipsForPhase(phase: PhaseType, level: GuidanceLevel): string[] {
      if (!shouldShowTips(phase, level)) return []
      const category = getTipCategoryForPhase(phase)
      if (!category) return []
      return getTipKeys(category)
    },
    getRandomTip(phase: PhaseType, level: GuidanceLevel): string | null {
      if (!shouldShowTips(phase, level)) return null
      const category = getTipCategoryForPhase(phase)
      if (!category) return null
      return `guidance.${category}.tip1` // Always return first tip for predictability
    },
    shouldShowTips,
  }
}

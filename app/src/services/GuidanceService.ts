import type { GuidanceLevel } from "@/domain/GuidanceLevel";
import { shouldShowTipsForPhase } from "@/domain/GuidanceLevel";
import type { PhaseType } from "@/domain/PhaseType";

export interface GuidanceTips {
  prep: string[];
  transition: string[];
  cooldown: string[];
}

export interface GuidanceServiceProtocol {
  getTipsForPhase(phaseType: PhaseType, level: GuidanceLevel): string[];
  getRandomTip(phaseType: PhaseType, level: GuidanceLevel): string | null;
  hasTipsForPhase(phaseType: PhaseType, level: GuidanceLevel): boolean;
}

// i18n key prefixes for guidance tips
const TIP_KEYS: GuidanceTips = {
  prep: [
    "guidance.prep.breathe",
    "guidance.prep.center",
    "guidance.prep.intention",
  ],
  transition: [
    "guidance.transition.handover",
    "guidance.transition.listen",
    "guidance.transition.pause",
  ],
  cooldown: [
    "guidance.cooldown.silence",
    "guidance.cooldown.reflect",
    "guidance.cooldown.gratitude",
    "guidance.cooldown.gentle",
  ],
};

export class GuidanceService implements GuidanceServiceProtocol {
  getTipsForPhase(phaseType: PhaseType, level: GuidanceLevel): string[] {
    if (!shouldShowTipsForPhase(level, phaseType)) {
      return [];
    }

    switch (phaseType) {
      case "prep":
        return TIP_KEYS.prep;
      case "transition":
        return TIP_KEYS.transition;
      case "cooldown":
        return TIP_KEYS.cooldown;
      default:
        return [];
    }
  }

  getRandomTip(phaseType: PhaseType, level: GuidanceLevel): string | null {
    const tips = this.getTipsForPhase(phaseType, level);
    if (tips.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
  }

  hasTipsForPhase(phaseType: PhaseType, level: GuidanceLevel): boolean {
    return this.getTipsForPhase(phaseType, level).length > 0;
  }
}

// Singleton instance
let sharedGuidanceService: GuidanceService | null = null;

export function getGuidanceService(): GuidanceService {
  if (!sharedGuidanceService) {
    sharedGuidanceService = new GuidanceService();
  }
  return sharedGuidanceService;
}

export type GuidanceLevel = "minimal" | "moderate" | "high";

export interface GuidanceFlags {
  showPrepTips: boolean;
  showTransitionTips: boolean;
  showBreathingExercise: boolean;
  showCooldownTips: boolean;
}

export function getGuidanceFlags(level: GuidanceLevel): GuidanceFlags {
  switch (level) {
    case "minimal":
      return {
        showPrepTips: false,
        showTransitionTips: false,
        showBreathingExercise: false,
        showCooldownTips: true,
      };
    case "moderate":
      return {
        showPrepTips: false,
        showTransitionTips: true,
        showBreathingExercise: true,
        showCooldownTips: true,
      };
    case "high":
      return {
        showPrepTips: true,
        showTransitionTips: true,
        showBreathingExercise: true,
        showCooldownTips: true,
      };
    default:
      return {
        showPrepTips: false,
        showTransitionTips: false,
        showBreathingExercise: false,
        showCooldownTips: true,
      };
  }
}

export function shouldShowTipsForPhase(
  level: GuidanceLevel,
  phaseType: string
): boolean {
  const flags = getGuidanceFlags(level);

  switch (phaseType) {
    case "prep":
      return flags.showPrepTips;
    case "transition":
      return flags.showTransitionTips;
    case "cooldown":
      return flags.showCooldownTips;
    default:
      return false;
  }
}

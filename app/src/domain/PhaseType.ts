export type PhaseType =
  | "prep"
  | "slotA"
  | "slotB"
  | "transition"
  | "closingA"
  | "closingB"
  | "cooldown";

export const PhaseTypeValues: PhaseType[] = [
  "prep",
  "slotA",
  "slotB",
  "transition",
  "closingA",
  "closingB",
  "cooldown",
];

export function isSpeakingPhase(phaseType: PhaseType): boolean {
  return phaseType === "slotA" || phaseType === "slotB";
}

export function isClosingPhase(phaseType: PhaseType): boolean {
  return phaseType === "closingA" || phaseType === "closingB";
}

export function isActivePhase(phaseType: PhaseType): boolean {
  return isSpeakingPhase(phaseType) || isClosingPhase(phaseType);
}

export function getPhaseOrder(phaseType: PhaseType): number {
  const order: Record<PhaseType, number> = {
    prep: 0,
    slotA: 1,
    slotB: 2,
    transition: 3,
    closingA: 4,
    closingB: 5,
    cooldown: 6,
  };
  return order[phaseType];
}

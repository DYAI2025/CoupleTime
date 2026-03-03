export type Speaker = "A" | "B" | null;

export function getSpeakerForPhase(phaseType: string): Speaker {
  if (phaseType === "slotA" || phaseType === "closingA") return "A";
  if (phaseType === "slotB" || phaseType === "closingB") return "B";
  return null;
}

export function getSpeakerColor(speaker: Speaker): string {
  if (speaker === "A") return "#ef4444"; // Red-500
  if (speaker === "B") return "#0ea5e9"; // Sky-500
  return "#94a3b8"; // Slate-400 (neutral)
}

export function getSpeakerColorClass(speaker: Speaker): string {
  if (speaker === "A") return "text-red-500";
  if (speaker === "B") return "text-sky-500";
  return "text-slate-400";
}

export function getSpeakerBgClass(speaker: Speaker): string {
  if (speaker === "A") return "bg-red-500";
  if (speaker === "B") return "bg-sky-500";
  return "bg-slate-400";
}

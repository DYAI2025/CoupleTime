export type AudioEvent =
  | "sessionStart"
  | "slotEnd"
  | "transitionEnd"
  | "closingStart"
  | "cooldownStart"
  | "cooldownEnd";

export const AudioEventValues: AudioEvent[] = [
  "sessionStart",
  "slotEnd",
  "transitionEnd",
  "closingStart",
  "cooldownStart",
  "cooldownEnd",
];

export function getAudioFileName(event: AudioEvent): string {
  const fileMap: Record<AudioEvent, string> = {
    sessionStart: "bowl_deep_single.wav",
    slotEnd: "bowl_rising.wav",
    transitionEnd: "bowl_clear.wav",
    closingStart: "bowl_double.wav",
    cooldownStart: "bowl_fade.wav",
    cooldownEnd: "bowl_triple.wav",
  };
  return fileMap[event];
}

export function getAudioPath(event: AudioEvent): string {
  return `/audio/${getAudioFileName(event)}`;
}

export function getEventForPhaseTransition(
  fromPhase: string,
  toPhase: string
): AudioEvent | null {
  // Session start
  if (fromPhase === "idle" && toPhase === "prep") {
    return "sessionStart";
  }

  // Slot end (transitioning from slot to something else)
  if (
    (fromPhase === "slotA" || fromPhase === "slotB") &&
    toPhase !== "slotA" &&
    toPhase !== "slotB"
  ) {
    return "slotEnd";
  }

  // Transition end
  if (fromPhase === "transition") {
    return "transitionEnd";
  }

  // Closing start
  if (toPhase === "closingA" || toPhase === "closingB") {
    return "closingStart";
  }

  // Cooldown start
  if (toPhase === "cooldown") {
    return "cooldownStart";
  }

  return null;
}

import type { PhaseType } from "./PhaseType";
import type { Speaker } from "./Speaker";
import { getSpeakerForPhase } from "./Speaker";

export interface PhaseConfig {
  id: string;
  type: PhaseType;
  duration: number; // in seconds
  allowedRange: { min: number; max: number };
}

export function createPhaseConfig(
  id: string,
  type: PhaseType,
  duration: number,
  allowedRange?: { min: number; max: number }
): PhaseConfig {
  const defaultRanges: Record<PhaseType, { min: number; max: number }> = {
    prep: { min: 30, max: 300 },
    slotA: { min: 60, max: 1800 },
    slotB: { min: 60, max: 1800 },
    transition: { min: 10, max: 120 },
    closingA: { min: 30, max: 600 },
    closingB: { min: 30, max: 600 },
    cooldown: { min: 60, max: 900 },
  };

  return {
    id,
    type,
    duration,
    allowedRange: allowedRange || defaultRanges[type],
  };
}

export function isValidPhaseConfig(phase: PhaseConfig): boolean {
  return (
    phase.duration >= phase.allowedRange.min &&
    phase.duration <= phase.allowedRange.max
  );
}

export function getPhaseSpeaker(phase: PhaseConfig): Speaker {
  return getSpeakerForPhase(phase.type);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationShort(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins} min`;
}

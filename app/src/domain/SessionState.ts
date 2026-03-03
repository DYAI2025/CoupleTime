export type SessionStatus = "idle" | "running" | "paused" | "finished";

export interface SessionState {
  status: SessionStatus;
  currentPhaseIndex: number;
  elapsedSessionTime: number; // in milliseconds
  remainingPhaseTime: number; // in milliseconds
  startTime: number | null;
  pausedAt: number | null;
}

export function createInitialSessionState(): SessionState {
  return {
    status: "idle",
    currentPhaseIndex: 0,
    elapsedSessionTime: 0,
    remainingPhaseTime: 0,
    startTime: null,
    pausedAt: null,
  };
}

export function isActiveState(state: SessionState): boolean {
  return state.status === "running" || state.status === "paused";
}

export function isPausedState(state: SessionState): boolean {
  return state.status === "paused";
}

export function isRunningState(state: SessionState): boolean {
  return state.status === "running";
}

export function isFinishedState(state: SessionState): boolean {
  return state.status === "finished";
}

export function canStart(state: SessionState): boolean {
  return state.status === "idle" || state.status === "finished";
}

export function canPause(state: SessionState): boolean {
  return state.status === "running";
}

export function canResume(state: SessionState): boolean {
  return state.status === "paused";
}

export function canStop(state: SessionState): boolean {
  return state.status === "running" || state.status === "paused";
}

export function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function calculateProgress(
  remainingTime: number,
  totalDuration: number
): number {
  if (totalDuration <= 0) return 0;
  const elapsed = totalDuration - remainingTime;
  return Math.min(1, Math.max(0, elapsed / totalDuration));
}

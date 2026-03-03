import type { PhaseConfig } from './PhaseConfig'
import type { GuidanceLevel } from './GuidanceLevel'
import { createPhaseConfig, formatDurationShort } from './PhaseConfig'

export interface SessionMode {
  id: string
  name: string
  description?: string
  phases: PhaseConfig[]
  guidanceLevel: GuidanceLevel
  isLocked: boolean
  isPreset: boolean
}

export function getTotalDuration(mode: SessionMode): number {
  return mode.phases.reduce((s, p) => s + p.duration, 0)
}

export function getFormattedTotalDuration(mode: SessionMode): string {
  return formatDurationShort(getTotalDuration(mode))
}

export function isValidSessionMode(mode: SessionMode): boolean {
  const hasA = mode.phases.some(p => p.type === 'slotA')
  const hasB = mode.phases.some(p => p.type === 'slotB')
  return hasA && hasB
}

export function getRoundCount(mode: SessionMode): number {
  return mode.phases.filter(p => p.type === 'slotA').length
}

export function createSessionMode(
  id: string, name: string, phases: PhaseConfig[],
  guidanceLevel: GuidanceLevel = 'moderate',
  isLocked = false, isPreset = false, description?: string,
): SessionMode {
  return { id, name, description, phases, guidanceLevel, isLocked, isPreset }
}

// ── Preset: Listening – 2 Runden × 10 min, ~45 min, Einsteiger ──────────────
export function createListeningMode(): SessionMode {
  return createSessionMode('listening', 'mode.listening.name', [
    createPhaseConfig('prep',         'prep',      90),
    createPhaseConfig('slotA1',       'slotA',    600),
    createPhaseConfig('slotB1',       'slotB',    600),
    createPhaseConfig('transition1',  'transition', 90),
    createPhaseConfig('slotA2',       'slotA',    600),
    createPhaseConfig('slotB2',       'slotB',    600),
    createPhaseConfig('closingA',     'closingA', 120),
    createPhaseConfig('closingB',     'closingB', 120),
    createPhaseConfig('cooldown',     'cooldown', 300),
  ], 'high', true, true, 'mode.listening.description')
}

// ── Preset: Commitment – 3 Runden × 10 min, ~60 min ─────────────────────────
export function createCommitmentMode(): SessionMode {
  return createSessionMode('commitment', 'mode.commitment.name', [
    createPhaseConfig('prep',         'prep',      120),
    createPhaseConfig('slotA1',       'slotA',    600),
    createPhaseConfig('slotB1',       'slotB',    600),
    createPhaseConfig('transition1',  'transition', 60),
    createPhaseConfig('slotA2',       'slotA',    600),
    createPhaseConfig('slotB2',       'slotB',    600),
    createPhaseConfig('transition2',  'transition', 60),
    createPhaseConfig('slotA3',       'slotA',    600),
    createPhaseConfig('slotB3',       'slotB',    600),
    createPhaseConfig('closingA',     'closingA', 120),
    createPhaseConfig('closingB',     'closingB', 120),
    createPhaseConfig('cooldown',     'cooldown', 600),
  ], 'moderate', true, true, 'mode.commitment.description')
}

// ── Preset: Maintain – 3 Runden × 15 min, ~90 min ───────────────────────────
export function createMaintainMode(): SessionMode {
  return createSessionMode('maintain', 'mode.maintain.name', [
    createPhaseConfig('prep',         'prep',      120),
    createPhaseConfig('slotA1',       'slotA',    900),
    createPhaseConfig('slotB1',       'slotB',    900),
    createPhaseConfig('transition1',  'transition', 60),
    createPhaseConfig('slotA2',       'slotA',    900),
    createPhaseConfig('slotB2',       'slotB',    900),
    createPhaseConfig('transition2',  'transition', 60),
    createPhaseConfig('slotA3',       'slotA',    900),
    createPhaseConfig('slotB3',       'slotB',    900),
    createPhaseConfig('closingA',     'closingA', 180),
    createPhaseConfig('closingB',     'closingB', 180),
    createPhaseConfig('cooldown',     'cooldown', 600),
  ], 'moderate', true, true, 'mode.maintain.description')
}

// Custom template
export function createCustomModeTemplate(): SessionMode {
  return createSessionMode(`custom-${Date.now()}`, 'mode.custom.name', [
    createPhaseConfig('prep',     'prep',     60),
    createPhaseConfig('slotA1',   'slotA',   300),
    createPhaseConfig('slotB1',   'slotB',   300),
    createPhaseConfig('cooldown', 'cooldown', 180),
  ], 'moderate', false, false, 'mode.custom.description')
}

export const PresetModes = {
  listening:  createListeningMode(),
  commitment: createCommitmentMode(),
  maintain:   createMaintainMode(),
}

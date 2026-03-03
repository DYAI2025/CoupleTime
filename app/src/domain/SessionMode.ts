import type { PhaseConfig } from './PhaseConfig'
import type { GuidanceLevel } from './GuidanceLevel'
import { createPhaseConfig, formatDurationShort } from './PhaseConfig'

export interface SessionMode {
  id: string
  name: string           // i18n key or display name
  description?: string
  phases: PhaseConfig[]
  guidanceLevel: GuidanceLevel
  isLocked: boolean
  isPreset: boolean
  /** Default transition duration override (seconds) */
  defaultTransitionSec?: number
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
  id: string,
  name: string,
  phases: PhaseConfig[],
  guidanceLevel: GuidanceLevel = 'moderate',
  isLocked = false,
  isPreset = false,
  description?: string,
  defaultTransitionSec?: number,
): SessionMode {
  return { id, name, description, phases, guidanceLevel, isLocked, isPreset, defaultTransitionSec }
}

// ── Schnell-Rituale (< 15 min) ────────────────────────────────────────────────

/** Tiny Check-in: 3 min × 2 Personen + 1 min Cooldown ≈ 7 min */
export function createTinyCheckInMode(): SessionMode {
  return createSessionMode('tiny-check-in', 'Tiny Check-in', [
    createPhaseConfig('prep',     'prep',      10,  undefined, { focusText: 'Hört auf, was ihr gerade tut. Kommt hier an.' }),
    createPhaseConfig('slotA1',   'slotA',    180,  undefined, { focusText: 'Sprich über dich – wie war dein Tag wirklich?' }),
    createPhaseConfig('trans1',   'transition', 10, undefined, { focusText: 'Kurze Pause. Atmet durch.' }),
    createPhaseConfig('slotB1',   'slotB',    180,  undefined, { focusText: 'Sprich über dich – wie war dein Tag wirklich?' }),
    createPhaseConfig('cooldown', 'cooldown',  60,  undefined, { focusText: 'Stille. Kein Nachgespräch.' }),
  ], 'high', false, true,
  'Ein kurzes tägliches Check-in – 3 Minuten pro Person. Ideal für zwischendurch.',
  10)
}

/** Conflict Cooldown: 2 min Atmen + 4 min × 2 ≈ 10 min */
export function createConflictCooldownMode(): SessionMode {
  return createSessionMode('conflict-cooldown', 'Conflict Cooldown', [
    createPhaseConfig('prep',     'prep',      120, undefined, { focusText: 'Atmet tief durch. Keine Worte. Einfach ankommen.' }),
    createPhaseConfig('slotA1',   'slotA',    240,  undefined, { focusText: 'Sprich aus deiner Perspektive. Kein Angriff – nur Gefühl.' }),
    createPhaseConfig('trans1',   'transition', 30, undefined, { focusText: 'Pause. Lass das Gesagte wirken.' }),
    createPhaseConfig('slotB1',   'slotB',    240,  undefined, { focusText: 'Sprich aus deiner Perspektive. Kein Angriff – nur Gefühl.' }),
    createPhaseConfig('cooldown', 'cooldown', 120,  undefined, { focusText: 'Kein Nachgespräch. Lasst es sacken.' }),
  ], 'high', false, true,
  'Strukturierte Pause bei Konflikten. Erst atmen, dann sprechen – jeder ungestört.',
  30)
}

/** Screen-free Tea: 15 min zusammen, kein Nachgespräch-Druck */
export function createScreenFreeTeaMode(): SessionMode {
  return createSessionMode('screen-free-tea', 'Screen-free Tea', [
    createPhaseConfig('slotA1',   'slotA',    450, undefined, { focusText: 'Phones weg. Einfach zusammen sein.' }),
    createPhaseConfig('trans1',   'transition',  0, undefined, { focusText: '' }),
    createPhaseConfig('slotB1',   'slotB',    450, undefined, { focusText: 'Sprich, schweig oder teile etwas Kleines.' }),
    createPhaseConfig('cooldown', 'cooldown',   0, undefined, { focusText: '' }),
  ], 'moderate', false, true,
  '15 Minuten ohne Bildschirme. Zusammen sein – reden, schweigen, ein Getränk teilen.',
  0)
}

// ── Vollständige Zwiegespräch-Formate ─────────────────────────────────────────

/** Einsteiger: 2 Runden × 10 min, ~50 min */
export function createListeningMode(): SessionMode {
  return createSessionMode('einsteiger-60', 'Einsteiger 60 min', [
    createPhaseConfig('prep',        'prep',       180),
    createPhaseConfig('slotA1',      'slotA',      600),
    createPhaseConfig('transition1', 'transition',  60),
    createPhaseConfig('slotB1',      'slotB',      600),
    createPhaseConfig('transition2', 'transition',  60),
    createPhaseConfig('slotA2',      'slotA',      600),
    createPhaseConfig('transition3', 'transition',  60),
    createPhaseConfig('slotB2',      'slotB',      600),
    createPhaseConfig('closingA',    'closingA',    60),
    createPhaseConfig('closingB',    'closingB',    60),
    createPhaseConfig('cooldown',    'cooldown',  1200),
  ], 'high', false, true,
  'Einsteiger-Format: 2 Runden à 10 Minuten pro Person. Ideal zum Ausprobieren.',
  60)
}

/** Commitment: 3 Runden × 10 min, ~65 min */
export function createCommitmentMode(): SessionMode {
  return createSessionMode('commitment-65', 'Commitment 65 min', [
    createPhaseConfig('prep',        'prep',       120),
    createPhaseConfig('slotA1',      'slotA',      600),
    createPhaseConfig('transition1', 'transition',  60),
    createPhaseConfig('slotB1',      'slotB',      600),
    createPhaseConfig('transition2', 'transition',  60),
    createPhaseConfig('slotA2',      'slotA',      600),
    createPhaseConfig('transition3', 'transition',  60),
    createPhaseConfig('slotB2',      'slotB',      600),
    createPhaseConfig('transition4', 'transition',  60),
    createPhaseConfig('slotA3',      'slotA',      600),
    createPhaseConfig('transition5', 'transition',  60),
    createPhaseConfig('slotB3',      'slotB',      600),
    createPhaseConfig('closingA',    'closingA',   120),
    createPhaseConfig('closingB',    'closingB',   120),
    createPhaseConfig('cooldown',    'cooldown',   600),
  ], 'moderate', false, true,
  'Mittleres Format: 3 Runden à 10 Minuten. Für regelmäßige Paare.',
  60)
}

/** Klassisch: 3 Runden × 15 min, ~90 min nach Moeller */
export function createMaintainMode(): SessionMode {
  return createSessionMode('klassisch-90', 'Klassisch 90 min', [
    createPhaseConfig('prep',        'prep',       300),
    createPhaseConfig('slotA1',      'slotA',      900),
    createPhaseConfig('transition1', 'transition',  60),
    createPhaseConfig('slotB1',      'slotB',      900),
    createPhaseConfig('transition2', 'transition',  60),
    createPhaseConfig('slotA2',      'slotA',      900),
    createPhaseConfig('transition3', 'transition',  60),
    createPhaseConfig('slotB2',      'slotB',      900),
    createPhaseConfig('transition4', 'transition',  60),
    createPhaseConfig('slotA3',      'slotA',      900),
    createPhaseConfig('transition5', 'transition',  60),
    createPhaseConfig('slotB3',      'slotB',      900),
    createPhaseConfig('closingA',    'closingA',   180),
    createPhaseConfig('closingB',    'closingB',   180),
    createPhaseConfig('cooldown',    'cooldown',  1800),
  ], 'moderate', false, true,
  'Das klassische Moeller-Zwiegespräch: 3×15 Minuten pro Person. 30 Min Nachgesprächsverbot.',
  60)
}

export function createCustomModeTemplate(): SessionMode {
  return createSessionMode(
    `custom-${Date.now()}`, 'Eigene Sitzung', [
      createPhaseConfig('prep',     'prep',     60),
      createPhaseConfig('slotA1',   'slotA',   300),
      createPhaseConfig('trans1',   'transition', 30),
      createPhaseConfig('slotB1',   'slotB',   300),
      createPhaseConfig('cooldown', 'cooldown', 180),
    ], 'moderate', false, false,
    'Eigene Sitzung selbst zusammenstellen.',
    30)
}

export const PresetModes: Record<string, SessionMode> = {
  'tiny-check-in':     createTinyCheckInMode(),
  'conflict-cooldown': createConflictCooldownMode(),
  'screen-free-tea':   createScreenFreeTeaMode(),
  'einsteiger-60':     createListeningMode(),
  'commitment-65':     createCommitmentMode(),
  'klassisch-90':      createMaintainMode(),
}

export function getPresetById(id: string): SessionMode | undefined {
  return PresetModes[id]
}

export const QuickPresets = ['tiny-check-in', 'conflict-cooldown', 'screen-free-tea']
export const FullPresets   = ['einsteiger-60', 'commitment-65', 'klassisch-90']

import { SessionMode, PresetModeId } from './SessionMode'
import { PhaseConfig, createPhaseConfig } from './PhaseConfig'
import { PhaseType } from './PhaseType'
import { GuidanceLevel } from './GuidanceLevel'

/**
 * Maintain Mode - Wöchentliches Beziehungshygiene-Gespräch
 * ~90 Minuten, 3 Runden × 15 min, GuidanceLevel: moderate
 *
 * Sequence: prep(120s) → slotA(900s) → slotB(900s) → transition(60s) →
 *           slotA(900s) → slotB(900s) → transition(60s) →
 *           slotA(900s) → slotB(900s) → closingA(180s) → closingB(180s) → cooldown(600s)
 */
function createMaintainPhases(): PhaseConfig[] {
  return [
    createPhaseConfig(PhaseType.Prep, 120, 'maintain-prep'),
    createPhaseConfig(PhaseType.SlotA, 900, 'maintain-slotA-1'),
    createPhaseConfig(PhaseType.SlotB, 900, 'maintain-slotB-1'),
    createPhaseConfig(PhaseType.Transition, 60, 'maintain-transition-1'),
    createPhaseConfig(PhaseType.SlotA, 900, 'maintain-slotA-2'),
    createPhaseConfig(PhaseType.SlotB, 900, 'maintain-slotB-2'),
    createPhaseConfig(PhaseType.Transition, 60, 'maintain-transition-2'),
    createPhaseConfig(PhaseType.SlotA, 900, 'maintain-slotA-3'),
    createPhaseConfig(PhaseType.SlotB, 900, 'maintain-slotB-3'),
    createPhaseConfig(PhaseType.ClosingA, 180, 'maintain-closingA'),
    createPhaseConfig(PhaseType.ClosingB, 180, 'maintain-closingB'),
    createPhaseConfig(PhaseType.Cooldown, 600, 'maintain-cooldown'),
  ]
}

export const MAINTAIN_MODE: SessionMode = {
  id: 'maintain',
  name: 'modes.maintain.name',
  description: 'modes.maintain.description',
  phases: createMaintainPhases(),
  guidanceLevel: GuidanceLevel.Moderate,
  isLocked: true,
}

/**
 * Commitment Mode - Stabilisierung in Krisenphasen
 * ~60 Minuten, 3 Runden × 10 min, GuidanceLevel: moderate
 * Empfohlen: 2× pro Woche
 *
 * Sequence: prep(120s) → slotA(600s) → slotB(600s) → transition(60s) →
 *           slotA(600s) → slotB(600s) → transition(60s) →
 *           slotA(600s) → slotB(600s) → closingA(120s) → closingB(120s) → cooldown(600s)
 */
function createCommitmentPhases(): PhaseConfig[] {
  return [
    createPhaseConfig(PhaseType.Prep, 120, 'commitment-prep'),
    createPhaseConfig(PhaseType.SlotA, 600, 'commitment-slotA-1'),
    createPhaseConfig(PhaseType.SlotB, 600, 'commitment-slotB-1'),
    createPhaseConfig(PhaseType.Transition, 60, 'commitment-transition-1'),
    createPhaseConfig(PhaseType.SlotA, 600, 'commitment-slotA-2'),
    createPhaseConfig(PhaseType.SlotB, 600, 'commitment-slotB-2'),
    createPhaseConfig(PhaseType.Transition, 60, 'commitment-transition-2'),
    createPhaseConfig(PhaseType.SlotA, 600, 'commitment-slotA-3'),
    createPhaseConfig(PhaseType.SlotB, 600, 'commitment-slotB-3'),
    createPhaseConfig(PhaseType.ClosingA, 120, 'commitment-closingA'),
    createPhaseConfig(PhaseType.ClosingB, 120, 'commitment-closingB'),
    createPhaseConfig(PhaseType.Cooldown, 600, 'commitment-cooldown'),
  ]
}

export const COMMITMENT_MODE: SessionMode = {
  id: 'commitment',
  name: 'modes.commitment.name',
  description: 'modes.commitment.description',
  phases: createCommitmentPhases(),
  guidanceLevel: GuidanceLevel.Moderate,
  isLocked: true,
}

/**
 * Listening Mode - Einsteiger-Modus mit mehr Anleitung
 * ~45 Minuten, 2 Runden × 10 min, GuidanceLevel: high
 *
 * Sequence: prep(90s) → slotA(600s) → slotB(600s) → transition(90s) →
 *           slotA(600s) → slotB(600s) → closingA(120s) → closingB(120s) → cooldown(600s)
 */
function createListeningPhases(): PhaseConfig[] {
  return [
    createPhaseConfig(PhaseType.Prep, 90, 'listening-prep'),
    createPhaseConfig(PhaseType.SlotA, 600, 'listening-slotA-1'),
    createPhaseConfig(PhaseType.SlotB, 600, 'listening-slotB-1'),
    createPhaseConfig(PhaseType.Transition, 90, 'listening-transition-1'),
    createPhaseConfig(PhaseType.SlotA, 600, 'listening-slotA-2'),
    createPhaseConfig(PhaseType.SlotB, 600, 'listening-slotB-2'),
    createPhaseConfig(PhaseType.ClosingA, 120, 'listening-closingA'),
    createPhaseConfig(PhaseType.ClosingB, 120, 'listening-closingB'),
    createPhaseConfig(PhaseType.Cooldown, 600, 'listening-cooldown'),
  ]
}

export const LISTENING_MODE: SessionMode = {
  id: 'listening',
  name: 'modes.listening.name',
  description: 'modes.listening.description',
  phases: createListeningPhases(),
  guidanceLevel: GuidanceLevel.High,
  isLocked: true,
}

/**
 * All preset modes
 */
export const PRESET_MODES: SessionMode[] = [
  MAINTAIN_MODE,
  COMMITMENT_MODE,
  LISTENING_MODE,
]

/**
 * Get a preset mode by ID
 */
export function getPresetMode(id: PresetModeId): SessionMode | undefined {
  return PRESET_MODES.find((mode) => mode.id === id)
}

/**
 * Create a custom mode template with minimal valid structure
 * (1 prep, 1 slotA, 1 slotB, 1 cooldown)
 */
export function createCustomTemplate(): PhaseConfig[] {
  return [
    createPhaseConfig(PhaseType.Prep, 120),
    createPhaseConfig(PhaseType.SlotA, 600),
    createPhaseConfig(PhaseType.SlotB, 600),
    createPhaseConfig(PhaseType.Cooldown, 600),
  ]
}

/**
 * Get default phase duration for a phase type
 */
export function getDefaultDuration(type: PhaseType): number {
  switch (type) {
    case PhaseType.Prep:
      return 120
    case PhaseType.SlotA:
    case PhaseType.SlotB:
      return 600
    case PhaseType.Transition:
      return 60
    case PhaseType.ClosingA:
    case PhaseType.ClosingB:
      return 120
    case PhaseType.Cooldown:
      return 600
  }
}

const QUESTIONS_PER_ROUND = 3
const ROUNDS = 3

export type CoupleCareSlot = 'slotA' | 'slotB'

/**
 * i18n keys for the impulse questions of one speaking phase.
 * Structure: couplecare.<themeId>.<slot>.r<round 1..3>.<1..3>
 * Rounds > 3 wrap modulo ROUNDS so long-lived couples never run dry.
 */
export function getCoupleCareTipKeys(
  themeId: string,
  round: number, // 1-based
  slot: CoupleCareSlot
): string[] {
  const r = ((((round - 1) % ROUNDS) + ROUNDS) % ROUNDS) + 1
  const keys: string[] = []
  for (let i = 1; i <= QUESTIONS_PER_ROUND; i++) {
    keys.push(`couplecare.${themeId}.${slot}.r${r}.${i}`)
  }
  return keys
}

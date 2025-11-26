import { describe, it, expect } from 'vitest'
import en from '../locales/en/translation.json'
import de from '../locales/de/translation.json'

function getKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).flatMap((key) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      return getKeys(obj[key], path)
    }
    return [path]
  })
}

describe('i18n Parity', () => {
  it('should have matching key structures in EN and DE', () => {
    const enKeys = getKeys(en).sort()
    const deKeys = getKeys(de).sort()
    expect(deKeys).toEqual(enKeys)
  })

  it('should have same array lengths for guidance quick tips', () => {
    expect(de.guidance.quick.prep).toHaveLength(en.guidance.quick.prep.length)
    expect(de.guidance.quick.transition).toHaveLength(en.guidance.quick.transition.length)
    expect(de.guidance.quick.cooldown).toHaveLength(en.guidance.quick.cooldown.length)
  })

  it('should have same number of deep dive cards', () => {
    expect(de.guidance.deepDive.beforeSession.cards).toHaveLength(
      en.guidance.deepDive.beforeSession.cards.length
    )
    expect(de.guidance.deepDive.duringListening.cards).toHaveLength(
      en.guidance.deepDive.duringListening.cards.length
    )
    expect(de.guidance.deepDive.emergency.cards).toHaveLength(
      en.guidance.deepDive.emergency.cards.length
    )
  })

  it('should have matching icons in deep dive cards', () => {
    const enBeforeIcons = en.guidance.deepDive.beforeSession.cards.map((c) => c.icon)
    const deBeforeIcons = de.guidance.deepDive.beforeSession.cards.map((c) => c.icon)
    expect(deBeforeIcons).toEqual(enBeforeIcons)

    const enDuringIcons = en.guidance.deepDive.duringListening.cards.map((c) => c.icon)
    const deDuringIcons = de.guidance.deepDive.duringListening.cards.map((c) => c.icon)
    expect(deDuringIcons).toEqual(enDuringIcons)

    const enEmergencyIcons = en.guidance.deepDive.emergency.cards.map((c) => c.icon)
    const deEmergencyIcons = de.guidance.deepDive.emergency.cards.map((c) => c.icon)
    expect(deEmergencyIcons).toEqual(enEmergencyIcons)
  })

  it('should have same number of rules in core rules', () => {
    expect(de.guidance.deepDive.coreRules.speaker.rules).toHaveLength(
      en.guidance.deepDive.coreRules.speaker.rules.length
    )
    expect(de.guidance.deepDive.coreRules.listener.rules).toHaveLength(
      en.guidance.deepDive.coreRules.listener.rules.length
    )
  })

  it('should have matching icons in core rules', () => {
    expect(de.guidance.deepDive.coreRules.speaker.icon).toEqual(
      en.guidance.deepDive.coreRules.speaker.icon
    )
    expect(de.guidance.deepDive.coreRules.listener.icon).toEqual(
      en.guidance.deepDive.coreRules.listener.icon
    )
  })
})

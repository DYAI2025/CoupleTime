import { describe, it, expect } from 'vitest'
import { AudioEvent, AUDIO_EVENT_FILES } from '../AudioEvent'

describe('AudioEvent', () => {
  describe('enum values', () => {
    it('has all 6 required events', () => {
      expect(AudioEvent.SessionStart).toBe('sessionStart')
      expect(AudioEvent.SlotEnd).toBe('slotEnd')
      expect(AudioEvent.TransitionEnd).toBe('transitionEnd')
      expect(AudioEvent.ClosingStart).toBe('closingStart')
      expect(AudioEvent.CooldownStart).toBe('cooldownStart')
      expect(AudioEvent.CooldownEnd).toBe('cooldownEnd')
    })
  })

  describe('AUDIO_EVENT_FILES', () => {
    it('has mapping for sessionStart', () => {
      expect(AUDIO_EVENT_FILES[AudioEvent.SessionStart]).toBe('bowl_deep_single')
    })

    it('has mapping for slotEnd', () => {
      expect(AUDIO_EVENT_FILES[AudioEvent.SlotEnd]).toBe('bowl_rising')
    })

    it('has mapping for transitionEnd', () => {
      expect(AUDIO_EVENT_FILES[AudioEvent.TransitionEnd]).toBe('bowl_clear')
    })

    it('has mapping for closingStart', () => {
      expect(AUDIO_EVENT_FILES[AudioEvent.ClosingStart]).toBe('bowl_double')
    })

    it('has mapping for cooldownStart', () => {
      expect(AUDIO_EVENT_FILES[AudioEvent.CooldownStart]).toBe('bowl_fade')
    })

    it('has mapping for cooldownEnd', () => {
      expect(AUDIO_EVENT_FILES[AudioEvent.CooldownEnd]).toBe('bowl_triple')
    })

    it('all events have non-empty file names', () => {
      Object.values(AudioEvent).forEach((event) => {
        const filename = AUDIO_EVENT_FILES[event]
        expect(filename).toBeDefined()
        expect(filename.length).toBeGreaterThan(0)
      })
    })

    it('has mappings for all AudioEvent values', () => {
      const eventValues = Object.values(AudioEvent)
      const mappedEvents = Object.keys(AUDIO_EVENT_FILES)

      expect(mappedEvents.length).toBe(eventValues.length)
      eventValues.forEach((event) => {
        expect(AUDIO_EVENT_FILES[event]).toBeDefined()
      })
    })
  })
})

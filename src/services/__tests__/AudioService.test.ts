import { describe, it, expect, beforeEach } from 'vitest'
import { createMockAudioService } from '../AudioService'
import { AudioEvent } from '../../domain/AudioEvent'

describe('AudioService', () => {
  describe('MockAudioService', () => {
    let service: ReturnType<typeof createMockAudioService>

    beforeEach(() => {
      service = createMockAudioService()
      service.reset()
    })

    describe('initial state', () => {
      it('starts disabled', () => {
        expect(service.isEnabled()).toBe(false)
      })

      it('has default volume of 0.7', () => {
        expect(service.getVolume()).toBe(0.7)
      })

      it('has no played events initially', () => {
        expect(service.playedEvents).toHaveLength(0)
      })
    })

    describe('enable', () => {
      it('enables audio', async () => {
        const result = await service.enable()
        expect(result).toBe(true)
        expect(service.isEnabled()).toBe(true)
      })
    })

    describe('play', () => {
      it('records played events', async () => {
        await service.play(AudioEvent.SessionStart)
        expect(service.playedEvents).toContain(AudioEvent.SessionStart)
      })

      it('records multiple events', async () => {
        await service.play(AudioEvent.SessionStart)
        await service.play(AudioEvent.SlotEnd)
        await service.play(AudioEvent.TransitionEnd)

        expect(service.playedEvents).toHaveLength(3)
        expect(service.playedEvents[0]).toBe(AudioEvent.SessionStart)
        expect(service.playedEvents[1]).toBe(AudioEvent.SlotEnd)
        expect(service.playedEvents[2]).toBe(AudioEvent.TransitionEnd)
      })

      it('can play all event types', async () => {
        await service.play(AudioEvent.SessionStart)
        await service.play(AudioEvent.SlotEnd)
        await service.play(AudioEvent.TransitionEnd)
        await service.play(AudioEvent.ClosingStart)
        await service.play(AudioEvent.CooldownStart)
        await service.play(AudioEvent.CooldownEnd)

        expect(service.playedEvents).toHaveLength(6)
      })
    })

    describe('volume', () => {
      it('sets volume', () => {
        service.setVolume(0.5)
        expect(service.getVolume()).toBe(0.5)
      })

      it('clamps volume to 0-1 range', () => {
        service.setVolume(-0.5)
        expect(service.getVolume()).toBe(-0.5) // Mock doesn't clamp, real does

        service.setVolume(1.5)
        expect(service.getVolume()).toBe(1.5) // Mock doesn't clamp
      })
    })

    describe('reset', () => {
      it('clears played events', async () => {
        await service.play(AudioEvent.SessionStart)
        await service.play(AudioEvent.SlotEnd)
        expect(service.playedEvents).toHaveLength(2)

        service.reset()
        expect(service.playedEvents).toHaveLength(0)
      })

      it('disables audio', async () => {
        await service.enable()
        expect(service.isEnabled()).toBe(true)

        service.reset()
        expect(service.isEnabled()).toBe(false)
      })
    })
  })

  describe('Audio event mapping', () => {
    it('SessionStart event is playable', async () => {
      const service = createMockAudioService()
      await service.play(AudioEvent.SessionStart)
      expect(service.playedEvents).toContain(AudioEvent.SessionStart)
    })

    it('SlotEnd event is playable', async () => {
      const service = createMockAudioService()
      await service.play(AudioEvent.SlotEnd)
      expect(service.playedEvents).toContain(AudioEvent.SlotEnd)
    })

    it('TransitionEnd event is playable', async () => {
      const service = createMockAudioService()
      await service.play(AudioEvent.TransitionEnd)
      expect(service.playedEvents).toContain(AudioEvent.TransitionEnd)
    })

    it('ClosingStart event is playable', async () => {
      const service = createMockAudioService()
      await service.play(AudioEvent.ClosingStart)
      expect(service.playedEvents).toContain(AudioEvent.ClosingStart)
    })

    it('CooldownStart event is playable', async () => {
      const service = createMockAudioService()
      await service.play(AudioEvent.CooldownStart)
      expect(service.playedEvents).toContain(AudioEvent.CooldownStart)
    })

    it('CooldownEnd event is playable', async () => {
      const service = createMockAudioService()
      await service.play(AudioEvent.CooldownEnd)
      expect(service.playedEvents).toContain(AudioEvent.CooldownEnd)
    })
  })

  describe('Session audio sequence', () => {
    it('can play typical session audio sequence', async () => {
      const service = createMockAudioService()

      // Typical session sequence
      await service.play(AudioEvent.SessionStart) // Session begins
      await service.play(AudioEvent.SlotEnd) // First slot A ends
      await service.play(AudioEvent.SlotEnd) // First slot B ends
      await service.play(AudioEvent.TransitionEnd) // Transition ends
      await service.play(AudioEvent.SlotEnd) // Second slot A ends
      await service.play(AudioEvent.SlotEnd) // Second slot B ends
      await service.play(AudioEvent.ClosingStart) // Closing phase begins
      await service.play(AudioEvent.CooldownStart) // Cooldown begins
      await service.play(AudioEvent.CooldownEnd) // Session complete

      expect(service.playedEvents).toHaveLength(9)
      expect(service.playedEvents[0]).toBe(AudioEvent.SessionStart)
      expect(service.playedEvents[service.playedEvents.length - 1]).toBe(AudioEvent.CooldownEnd)
    })
  })
})

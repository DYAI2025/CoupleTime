import { describe, it, expect, beforeEach } from 'vitest'
import { createMockPersistenceService } from '../PersistenceService'
import { createCustomMode } from '../../domain/SessionMode'
import { createPhaseConfig } from '../../domain/PhaseConfig'
import { PhaseType } from '../../domain/PhaseType'
import { GuidanceLevel } from '../../domain/GuidanceLevel'

describe('PersistenceService', () => {
  describe('MockPersistenceService', () => {
    let service: ReturnType<typeof createMockPersistenceService>

    beforeEach(() => {
      service = createMockPersistenceService()
    })

    describe('Custom Modes', () => {
      it('starts with empty modes', () => {
        const modes = service.loadCustomModes()
        expect(modes).toHaveLength(0)
      })

      it('adds a custom mode', () => {
        const mode = createCustomMode('Test Mode', [
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
        ])

        service.addCustomMode(mode)

        const modes = service.loadCustomModes()
        expect(modes).toHaveLength(1)
        expect(modes[0].name).toBe('Test Mode')
      })

      it('saves and loads multiple modes', () => {
        const mode1 = createCustomMode('Mode 1', [
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
        ])
        const mode2 = createCustomMode('Mode 2', [
          createPhaseConfig(PhaseType.SlotA, 900),
          createPhaseConfig(PhaseType.SlotB, 900),
        ])

        service.saveCustomModes([mode1, mode2])

        const modes = service.loadCustomModes()
        expect(modes).toHaveLength(2)
        expect(modes[0].name).toBe('Mode 1')
        expect(modes[1].name).toBe('Mode 2')
      })

      it('updates existing mode', () => {
        const mode = createCustomMode('Original', [
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
        ])
        service.addCustomMode(mode)

        const updated = { ...mode, name: 'Updated' }
        service.updateCustomMode(updated)

        const modes = service.loadCustomModes()
        expect(modes).toHaveLength(1)
        expect(modes[0].name).toBe('Updated')
      })

      it('adds mode if id not found during update', () => {
        const mode = createCustomMode('New Mode', [
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
        ])

        service.updateCustomMode(mode)

        const modes = service.loadCustomModes()
        expect(modes).toHaveLength(1)
      })

      it('deletes a mode', () => {
        const mode1 = createCustomMode('Mode 1', [
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
        ])
        const mode2 = createCustomMode('Mode 2', [
          createPhaseConfig(PhaseType.SlotA, 900),
          createPhaseConfig(PhaseType.SlotB, 900),
        ])

        service.saveCustomModes([mode1, mode2])
        service.deleteCustomMode(mode1.id)

        const modes = service.loadCustomModes()
        expect(modes).toHaveLength(1)
        expect(modes[0].name).toBe('Mode 2')
      })

      it('gets a specific mode by id', () => {
        const mode = createCustomMode('Find Me', [
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
        ])
        service.addCustomMode(mode)

        const found = service.getCustomMode(mode.id)
        expect(found).toBeDefined()
        expect(found?.name).toBe('Find Me')
      })

      it('returns undefined for unknown mode id', () => {
        const found = service.getCustomMode('non-existent')
        expect(found).toBeUndefined()
      })
    })

    describe('Settings', () => {
      it('returns default settings initially', () => {
        const settings = service.loadSettings()
        expect(settings.language).toBe('de')
        expect(settings.volume).toBe(0.7)
      })

      it('saves and loads settings', () => {
        service.saveSettings({
          language: 'en',
          volume: 0.5,
          lastUsedModeId: 'maintain',
        })

        const settings = service.loadSettings()
        expect(settings.language).toBe('en')
        expect(settings.volume).toBe(0.5)
        expect(settings.lastUsedModeId).toBe('maintain')
      })

      it('updates a single setting', () => {
        service.updateSetting('volume', 0.3)

        const settings = service.loadSettings()
        expect(settings.volume).toBe(0.3)
        expect(settings.language).toBe('de') // Other settings preserved
      })

      it('updates language setting', () => {
        service.updateSetting('language', 'en')

        const settings = service.loadSettings()
        expect(settings.language).toBe('en')
      })
    })

    describe('clear helper', () => {
      it('clears all data', () => {
        const mode = createCustomMode('Test', [
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
        ])
        service.addCustomMode(mode)
        service.updateSetting('volume', 0.1)

        service.clear()

        expect(service.loadCustomModes()).toHaveLength(0)
        expect(service.loadSettings().volume).toBe(0.7) // Back to default
      })
    })
  })

  describe('Performance requirements', () => {
    it('loads and saves quickly (< 50ms for typical data)', () => {
      const service = createMockPersistenceService()

      // Create 10 custom modes (typical realistic amount)
      const modes = Array.from({ length: 10 }, (_, i) =>
        createCustomMode(`Mode ${i}`, [
          createPhaseConfig(PhaseType.Prep, 120),
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
          createPhaseConfig(PhaseType.Transition, 60),
          createPhaseConfig(PhaseType.SlotA, 600),
          createPhaseConfig(PhaseType.SlotB, 600),
          createPhaseConfig(PhaseType.Cooldown, 600),
        ], GuidanceLevel.Moderate)
      )

      const startSave = performance.now()
      service.saveCustomModes(modes)
      const saveDuration = performance.now() - startSave

      const startLoad = performance.now()
      service.loadCustomModes()
      const loadDuration = performance.now() - startLoad

      // Both operations should be < 50ms
      expect(saveDuration).toBeLessThan(50)
      expect(loadDuration).toBeLessThan(50)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { createDefaultParticipantConfig, ParticipantConfig } from '../domain/ParticipantConfig'
import { LocalStorageParticipantService } from '../services/ParticipantPersistenceService'
import { createSessionViewModel, createIdleViewModel } from '../viewmodels/SessionViewModel'
import { createInitialState } from '../domain/SessionState'
import { getContrastingTextColor } from '../utils/colorContrast'

describe('Participant Personalization Integration', () => {
  let service: LocalStorageParticipantService

  beforeEach(() => {
    localStorage.clear()
    service = new LocalStorageParticipantService()
  })

  describe('Persistence round-trip', () => {
    it('saves and reloads custom names', () => {
      const config: ParticipantConfig = {
        nameA: 'Alice',
        nameB: 'Bob',
        colorA: '#ff0000',
        colorB: '#0000ff',
      }
      service.saveConfig(config)
      const loaded = service.loadConfig()
      expect(loaded.nameA).toBe('Alice')
      expect(loaded.nameB).toBe('Bob')
    })

    it('saves and reloads custom colors', () => {
      const config: ParticipantConfig = {
        nameA: 'Alice',
        nameB: 'Bob',
        colorA: '#ff6600',
        colorB: '#00cc99',
      }
      service.saveConfig(config)
      const loaded = service.loadConfig()
      expect(loaded.colorA).toBe('#ff6600')
      expect(loaded.colorB).toBe('#00cc99')
    })

    it('returns defaults when localStorage is empty', () => {
      const loaded = service.loadConfig()
      expect(loaded).toEqual(createDefaultParticipantConfig())
    })

    it('falls back to defaults for malformed JSON', () => {
      localStorage.setItem('ct_participant_config', 'not-json')
      const loaded = service.loadConfig()
      expect(loaded).toEqual(createDefaultParticipantConfig())
    })
  })

  describe('ViewModel integration', () => {
    it('viewModel exposes custom names from participantConfig', () => {
      const config: ParticipantConfig = {
        nameA: 'Alice',
        nameB: 'Bob',
        colorA: '#ff0000',
        colorB: '#0000ff',
      }
      const vm = createSessionViewModel(createInitialState(), config)
      expect(vm.participantNameA).toBe('Alice')
      expect(vm.participantNameB).toBe('Bob')
    })

    it('viewModel exposes custom colors from participantConfig', () => {
      const config: ParticipantConfig = {
        nameA: 'Alice',
        nameB: 'Bob',
        colorA: '#ff0000',
        colorB: '#0000ff',
      }
      const vm = createSessionViewModel(createInitialState(), config)
      expect(vm.participantColorA).toBe('#ff0000')
      expect(vm.participantColorB).toBe('#0000ff')
    })

    it('idle viewModel has default participant values', () => {
      const defaults = createDefaultParticipantConfig()
      const vm = createIdleViewModel()
      expect(vm.participantNameA).toBe(defaults.nameA)
      expect(vm.participantNameB).toBe(defaults.nameB)
      expect(vm.participantColorA).toBe(defaults.colorA)
      expect(vm.participantColorB).toBe(defaults.colorB)
    })
  })

  describe('Color contrast accessibility', () => {
    it('dark background produces white text', () => {
      expect(getContrastingTextColor('#1a1a2e')).toBe('#ffffff')
    })

    it('light background produces black text', () => {
      expect(getContrastingTextColor('#f0f4ff')).toBe('#000000')
    })

    it('default colorA (#3b82f6) produces readable text', () => {
      const text = getContrastingTextColor('#3b82f6')
      expect(['#ffffff', '#000000']).toContain(text)
    })

    it('default colorB (#8b5cf6) produces readable text', () => {
      const text = getContrastingTextColor('#8b5cf6')
      expect(['#ffffff', '#000000']).toContain(text)
    })
  })
})

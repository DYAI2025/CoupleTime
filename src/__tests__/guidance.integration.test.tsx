import { describe, it, expect } from 'vitest'
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS } from '../domain/GuidanceSettings'
import { createMockPersistenceService } from '../services/PersistenceService'

describe('Guidance Integration Test', () => {
  it('should verify settings persist and can be changed', () => {
    const mockPersistenceService = createMockPersistenceService()

    // Test that guidance settings persist in localStorage
    const initialSettings = mockPersistenceService.loadGuidanceSettings()
    expect(initialSettings).toEqual(DEFAULT_GUIDANCE_SETTINGS)

    // Update settings
    const newSettings: GuidanceSettings = {
      enableInMaintain: false,
      showAllTips: true,
      autoRotateInterval: 20,
      guidanceMode: 'deep-dive',
    }
    mockPersistenceService.saveGuidanceSettings(newSettings)

    // Verify settings were saved
    const savedSettings = mockPersistenceService.loadGuidanceSettings()
    expect(savedSettings.enableInMaintain).toBe(false)
    expect(savedSettings.showAllTips).toBe(true)
    expect(savedSettings.autoRotateInterval).toBe(20)
    expect(savedSettings.guidanceMode).toBe('deep-dive')

    // Verify it persists after reload
    const reloadedSettings = mockPersistenceService.loadGuidanceSettings()
    expect(reloadedSettings).toEqual(newSettings)
  })

  it('should verify default guidance settings behavior', () => {
    const mockPersistenceService = createMockPersistenceService()
    const initialSettings = mockPersistenceService.loadGuidanceSettings()

    expect(initialSettings.enableInMaintain).toBe(true)
    expect(initialSettings.showAllTips).toBe(false)
    expect(initialSettings.autoRotateInterval).toBe(30)
    expect(initialSettings.guidanceMode).toBe('quick')
  })

  it('should verify guidance settings validation', () => {
    const mockPersistenceService = createMockPersistenceService()

    // Test with valid settings
    const validSettings: GuidanceSettings = {
      enableInMaintain: true,
      showAllTips: true,
      autoRotateInterval: 45, // Within 10-60 range
      guidanceMode: 'deep-dive'
    }

    mockPersistenceService.saveGuidanceSettings(validSettings)
    const loadedSettings = mockPersistenceService.loadGuidanceSettings()

    expect(loadedSettings).toEqual(validSettings)

    // Test with boundary values
    const boundarySettings: GuidanceSettings = {
      enableInMaintain: false,
      showAllTips: false,
      autoRotateInterval: 10, // Minimum
      guidanceMode: 'quick'
    }

    mockPersistenceService.saveGuidanceSettings(boundarySettings)
    const loadedBoundarySettings = mockPersistenceService.loadGuidanceSettings()
    expect(loadedBoundarySettings.autoRotateInterval).toBe(10)

    // Test upper boundary
    const upperBoundarySettings: GuidanceSettings = {
      ...DEFAULT_GUIDANCE_SETTINGS,
      autoRotateInterval: 60, // Maximum
    }

    mockPersistenceService.saveGuidanceSettings(upperBoundarySettings)
    const loadedUpperSettings = mockPersistenceService.loadGuidanceSettings()
    expect(loadedUpperSettings.autoRotateInterval).toBe(60)
  })
})

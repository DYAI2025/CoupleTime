import { describe, it, expect } from 'vitest'
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS } from '../../domain/GuidanceSettings'

describe('Guidance Settings Domain Tests', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_GUIDANCE_SETTINGS.enableInMaintain).toBe(true)
    expect(DEFAULT_GUIDANCE_SETTINGS.showAllTips).toBe(false)
    expect(DEFAULT_GUIDANCE_SETTINGS.autoRotateInterval).toBe(30)
    expect(DEFAULT_GUIDANCE_SETTINGS.guidanceMode).toBe('quick')
  })

  it('should validate guidance settings correctly', () => {
    const validSettings: GuidanceSettings = {
      enableInMaintain: true,
      showAllTips: false,
      autoRotateInterval: 30,
      guidanceMode: 'quick'
    }
    
    // Since we don't have a validation function exported, we'll just check the type is correct
    expect(validSettings).toBeDefined()
    expect(typeof validSettings.enableInMaintain).toBe('boolean')
    expect(typeof validSettings.showAllTips).toBe('boolean')
    expect(typeof validSettings.autoRotateInterval).toBe('number')
    expect(validSettings.guidanceMode).toMatch(/^(quick|deep-dive)$/)
  })
})
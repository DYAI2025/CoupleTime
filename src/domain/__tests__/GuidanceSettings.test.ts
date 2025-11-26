import { describe, it, expect } from 'vitest'
import {
  GuidanceSettings,
  DEFAULT_GUIDANCE_SETTINGS,
  createGuidanceSettings,
} from '../GuidanceSettings'

describe('GuidanceSettings', () => {
  it('should create default guidance settings', () => {
    const settings = createGuidanceSettings()
    expect(settings.showAllTips).toBe(false)
    expect(settings.guidanceMode).toBe('quick')
    expect(settings.enableInMaintain).toBe(false)
    expect(settings.autoRotateInterval).toBe(20)
  })

  it('should merge partial settings with defaults', () => {
    const settings = createGuidanceSettings({ showAllTips: true })
    expect(settings.showAllTips).toBe(true)
    expect(settings.guidanceMode).toBe('quick') // still default
  })
})

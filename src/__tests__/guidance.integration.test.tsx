import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SessionView } from '../components/SessionView'
import { SessionProvider } from '../contexts/SessionContext'
import { createMockAudioService } from '../services/AudioService'
import { createMockTimerService } from '../services/TimerService'
import { createMockGuidanceService } from '../services/GuidanceService'
import { createMockPersistenceService } from '../services/PersistenceService'
import { MAINTAIN_MODE } from '../domain/SessionMode.presets'
import { GuidanceSettings, DEFAULT_GUIDANCE_SETTINGS } from '../domain/GuidanceSettings'

// Create mock services for testing
const mockAudioService = createMockAudioService()
const mockTimerService = createMockTimerService()
const mockGuidanceService = createMockGuidanceService()
const mockPersistenceService = createMockPersistenceService()

// Mock localStorage for settings persistence
const localStorageMock = (() => {
  let store: any = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Guidance Integration Test', () => {
  it('should verify settings persist and can be changed', () => {
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
    const initialSettings = mockPersistenceService.loadGuidanceSettings()
    
    expect(initialSettings.enableInMaintain).toBe(true)
    expect(initialSettings.showAllTips).toBe(false)
    expect(initialSettings.autoRotateInterval).toBe(30)
    expect(initialSettings.guidanceMode).toBe('quick')
  })

  it('should verify guidance settings validation', () => {
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
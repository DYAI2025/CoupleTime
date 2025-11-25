import { SessionMode } from '../domain/SessionMode'

const STORAGE_KEY = 'couples-timer-custom-modes'
const SETTINGS_KEY = 'couples-timer-settings'

/**
 * User settings stored in localStorage
 */
export interface UserSettings {
  language: 'de' | 'en'
  volume: number
  lastUsedModeId?: string
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'de',
  volume: 0.7,
}

/**
 * PersistenceService protocol
 */
export interface PersistenceServiceProtocol {
  // Custom modes
  loadCustomModes(): SessionMode[]
  saveCustomModes(modes: SessionMode[]): void
  addCustomMode(mode: SessionMode): void
  updateCustomMode(mode: SessionMode): void
  deleteCustomMode(modeId: string): void
  getCustomMode(modeId: string): SessionMode | undefined

  // Settings
  loadSettings(): UserSettings
  saveSettings(settings: UserSettings): void
  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void
}

class PersistenceServiceImpl implements PersistenceServiceProtocol {
  // Custom modes

  loadCustomModes(): SessionMode[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []

      // Basic validation - ensure each item has required fields
      return parsed.filter(
        (item): item is SessionMode =>
          item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          Array.isArray(item.phases)
      )
    } catch {
      console.warn('Failed to load custom modes from localStorage')
      return []
    }
  }

  saveCustomModes(modes: SessionMode[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modes))
    } catch (error) {
      console.error('Failed to save custom modes to localStorage', error)
    }
  }

  addCustomMode(mode: SessionMode): void {
    const modes = this.loadCustomModes()
    modes.push(mode)
    this.saveCustomModes(modes)
  }

  updateCustomMode(mode: SessionMode): void {
    const modes = this.loadCustomModes()
    const index = modes.findIndex((m) => m.id === mode.id)

    if (index >= 0) {
      modes[index] = mode
    } else {
      modes.push(mode)
    }

    this.saveCustomModes(modes)
  }

  deleteCustomMode(modeId: string): void {
    const modes = this.loadCustomModes()
    const filtered = modes.filter((m) => m.id !== modeId)
    this.saveCustomModes(filtered)
  }

  getCustomMode(modeId: string): SessionMode | undefined {
    const modes = this.loadCustomModes()
    return modes.find((m) => m.id === modeId)
  }

  // Settings

  loadSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (!stored) return { ...DEFAULT_SETTINGS }

      const parsed = JSON.parse(stored)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      }
    } catch {
      console.warn('Failed to load settings from localStorage')
      return { ...DEFAULT_SETTINGS }
    }
  }

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings to localStorage', error)
    }
  }

  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    const settings = this.loadSettings()
    settings[key] = value
    this.saveSettings(settings)
  }
}

// Singleton export
export const PersistenceService: PersistenceServiceProtocol = new PersistenceServiceImpl()

/**
 * Create mock for testing (uses in-memory storage)
 */
export function createMockPersistenceService(): PersistenceServiceProtocol & {
  clear: () => void
  getModes: () => SessionMode[]
  getStoredSettings: () => UserSettings
} {
  let modes: SessionMode[] = []
  let settings: UserSettings = { ...DEFAULT_SETTINGS }

  return {
    loadCustomModes: () => [...modes],
    saveCustomModes: (newModes) => {
      modes = [...newModes]
    },
    addCustomMode: (mode) => {
      modes.push(mode)
    },
    updateCustomMode: (mode) => {
      const index = modes.findIndex((m) => m.id === mode.id)
      if (index >= 0) {
        modes[index] = mode
      } else {
        modes.push(mode)
      }
    },
    deleteCustomMode: (modeId) => {
      modes = modes.filter((m) => m.id !== modeId)
    },
    getCustomMode: (modeId) => modes.find((m) => m.id === modeId),

    loadSettings: () => ({ ...settings }),
    saveSettings: (newSettings) => {
      settings = { ...newSettings }
    },
    updateSetting: (key, value) => {
      settings[key] = value
    },

    // Test helpers
    clear: () => {
      modes = []
      settings = { ...DEFAULT_SETTINGS }
    },
    getModes: () => modes,
    getStoredSettings: () => settings,
  }
}

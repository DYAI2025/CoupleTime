import { BackgroundConfig, createDefaultBackgroundConfig } from '../domain/BackgroundConfig';

const BACKGROUND_CONFIG_KEY = 'ct_background_config';

export interface BackgroundPersistenceService {
  loadConfig(): BackgroundConfig;
  saveConfig(config: BackgroundConfig): void;
}

export class LocalStorageBackgroundService implements BackgroundPersistenceService {
  loadConfig(): BackgroundConfig {
    try {
      const stored = localStorage.getItem(BACKGROUND_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          primaryColor: parsed.primaryColor || createDefaultBackgroundConfig().primaryColor,
          backgroundImage: parsed.backgroundImage || createDefaultBackgroundConfig().backgroundImage,
        };
      }
    } catch (error) {
      console.error('Error loading background config:', error);
    }
    
    return createDefaultBackgroundConfig();
  }

  saveConfig(config: BackgroundConfig): void {
    try {
      localStorage.setItem(BACKGROUND_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving background config:', error);
    }
  }
}

// Export a singleton instance
export const backgroundPersistenceService = new LocalStorageBackgroundService();
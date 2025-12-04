import { ParticipantConfig, createDefaultParticipantConfig } from '../domain/ParticipantConfig';

const PARTICIPANT_CONFIG_KEY = 'ct_participant_config';

export interface ParticipantPersistenceService {
  loadConfig(): ParticipantConfig;
  saveConfig(config: ParticipantConfig): void;
}

export class LocalStorageParticipantService implements ParticipantPersistenceService {
  loadConfig(): ParticipantConfig {
    try {
      const stored = localStorage.getItem(PARTICIPANT_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          nameA: parsed.nameA || createDefaultParticipantConfig().nameA,
          nameB: parsed.nameB || createDefaultParticipantConfig().nameB,
          colorA: parsed.colorA || createDefaultParticipantConfig().colorA,
          colorB: parsed.colorB || createDefaultParticipantConfig().colorB,
        };
      }
    } catch (error) {
      console.error('Error loading participant config:', error);
    }
    
    return createDefaultParticipantConfig();
  }

  saveConfig(config: ParticipantConfig): void {
    try {
      localStorage.setItem(PARTICIPANT_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving participant config:', error);
    }
  }
}

// Export a singleton instance
export const participantPersistenceService = new LocalStorageParticipantService();
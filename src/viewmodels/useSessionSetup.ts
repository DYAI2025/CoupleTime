import { useState, useEffect } from 'react';
import { ParticipantConfig, createDefaultParticipantConfig } from '../domain/ParticipantConfig';
import { participantPersistenceService } from '../services/ParticipantPersistenceService';

export const useSessionSetup = () => {
  const [participantConfig, setParticipantConfig] = useState<ParticipantConfig>(createDefaultParticipantConfig());
  const [isSetupVisible, setIsSetupVisible] = useState(false);

  useEffect(() => {
    // Load participant config from persistence when component mounts
    const savedConfig = participantPersistenceService.loadConfig();
    setParticipantConfig(savedConfig);
  }, []);

  const saveParticipantConfig = (config: ParticipantConfig) => {
    participantPersistenceService.saveConfig(config);
    setParticipantConfig(config);
    setIsSetupVisible(false);
  };

  const resetToDefault = () => {
    const defaultConfig = createDefaultParticipantConfig();
    participantPersistenceService.saveConfig(defaultConfig);
    setParticipantConfig(defaultConfig);
    setIsSetupVisible(false);
  };

  return {
    participantConfig,
    isSetupVisible,
    setIsSetupVisible,
    saveParticipantConfig,
    resetToDefault,
  };
};
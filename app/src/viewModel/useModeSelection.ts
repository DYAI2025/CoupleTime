import { useState, useEffect, useCallback } from "react";
import type { SessionMode } from "@/domain/SessionMode";
import {
  PresetModes,
  createCustomModeTemplate,
  isValidSessionMode,
} from "@/domain/SessionMode";
import { getPersistenceService } from "@/services/PersistenceService";

export interface UseModeSelectionReturn {
  presetModes: SessionMode[];
  customModes: SessionMode[];
  selectedMode: SessionMode | null;
  selectMode: (mode: SessionMode) => void;
  createCustomMode: () => SessionMode;
  updateCustomMode: (mode: SessionMode) => Promise<void>;
  deleteCustomMode: (modeId: string) => Promise<void>;
  isLoading: boolean;
}

export function useModeSelection(): UseModeSelectionReturn {
  const [customModes, setCustomModes] = useState<SessionMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistenceService = getPersistenceService();

  // Load custom modes on mount
  useEffect(() => {
    const loadCustomModes = async () => {
      try {
        const modes = await persistenceService.loadCustomModes();
        setCustomModes(modes);
      } catch (error) {
        console.error("Failed to load custom modes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomModes();
  }, []);

  const selectMode = useCallback((mode: SessionMode | null) => {
    setSelectedMode(mode);
  }, []);

  const createCustomMode = useCallback((): SessionMode => {
    return createCustomModeTemplate();
  }, []);

  const updateCustomMode = useCallback(
    async (mode: SessionMode): Promise<void> => {
      if (!isValidSessionMode(mode)) {
        throw new Error("Invalid session mode: must have at least one slotA and one slotB");
      }

      const updatedModes = [...customModes];
      const existingIndex = updatedModes.findIndex((m) => m.id === mode.id);

      if (existingIndex >= 0) {
        updatedModes[existingIndex] = mode;
      } else {
        updatedModes.push(mode);
      }

      await persistenceService.saveCustomModes(updatedModes);
      setCustomModes(updatedModes);
    },
    [customModes]
  );

  const deleteCustomMode = useCallback(
    async (modeId: string): Promise<void> => {
      await persistenceService.deleteCustomMode(modeId);
      const updatedModes = customModes.filter((m) => m.id !== modeId);
      setCustomModes(updatedModes);

      if (selectedMode?.id === modeId) {
        setSelectedMode(null);
      }
    },
    [customModes, selectedMode]
  );

  const presetModes = Object.values(PresetModes);

  return {
    presetModes,
    customModes,
    selectedMode,
    selectMode,
    createCustomMode,
    updateCustomMode,
    deleteCustomMode,
    isLoading,
  };
}

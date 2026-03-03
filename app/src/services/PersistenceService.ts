import type { SessionMode } from "@/domain/SessionMode";

const STORAGE_KEY = "couples-timer-custom-modes";

export interface PersistenceServiceProtocol {
  saveCustomModes(modes: SessionMode[]): Promise<void>;
  loadCustomModes(): Promise<SessionMode[]>;
  deleteCustomMode(modeId: string): Promise<void>;
  clearAll(): Promise<void>;
}

export class PersistenceService implements PersistenceServiceProtocol {
  async saveCustomModes(modes: SessionMode[]): Promise<void> {
    try {
      const data = JSON.stringify(modes);
      localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
      console.error("Failed to save custom modes:", error);
      throw new Error("Failed to save custom modes");
    }
  }

  async loadCustomModes(): Promise<SessionMode[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const modes = JSON.parse(data) as SessionMode[];

      // Validate loaded data
      if (!Array.isArray(modes)) {
        console.warn("Invalid custom modes data, clearing storage");
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }

      return modes;
    } catch (error) {
      console.error("Failed to load custom modes:", error);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  async deleteCustomMode(modeId: string): Promise<void> {
    try {
      const modes = await this.loadCustomModes();
      const filtered = modes.filter((m) => m.id !== modeId);
      await this.saveCustomModes(filtered);
    } catch (error) {
      console.error("Failed to delete custom mode:", error);
      throw new Error("Failed to delete custom mode");
    }
  }

  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear storage:", error);
      throw new Error("Failed to clear storage");
    }
  }
}

// Singleton instance
let sharedPersistenceService: PersistenceService | null = null;

export function getPersistenceService(): PersistenceService {
  if (!sharedPersistenceService) {
    sharedPersistenceService = new PersistenceService();
  }
  return sharedPersistenceService;
}

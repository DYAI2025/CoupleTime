/**
 * Configuration for background settings
 * Contains primary color and optional background image
 */
export interface BackgroundConfig {
  primaryColor: string;
  backgroundImage: string | null;
}

/**
 * Creates a default background configuration
 */
export function createDefaultBackgroundConfig(): BackgroundConfig {
  return {
    primaryColor: '#f0f9ff', // blue-50
    backgroundImage: null,
  };
}
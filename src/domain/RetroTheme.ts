/**
 * CoupleCare: rotating retrospective themes.
 * Each session gets a different theme (deterministic rotation by session index),
 * so the work on the relationship stays varied and never becomes routine.
 */
export interface RetroTheme {
  /** Stable i18n id, e.g. 'appreciation' */
  id: string
  /** i18n key of the theme display name */
  nameKey: string
}

export const RETRO_THEMES: RetroTheme[] = [
  { id: 'appreciation', nameKey: 'couplecare.themes.appreciation' },
  { id: 'everyday-load', nameKey: 'couplecare.themes.everyday-load' },
  { id: 'wishes', nameKey: 'couplecare.themes.wishes' },
  { id: 'repair', nameKey: 'couplecare.themes.repair' },
  { id: 'future', nameKey: 'couplecare.themes.future' },
  { id: 'boundaries', nameKey: 'couplecare.themes.boundaries' },
]

export const THEME_COUNT = RETRO_THEMES.length

/**
 * Deterministically pick the theme for a session (0-based index).
 * Wraps around so every session differs until THEME_COUNT is reached.
 */
export function selectThemeForSession(sessionIndex: number): RetroTheme {
  const i = ((sessionIndex % THEME_COUNT) + THEME_COUNT) % THEME_COUNT
  return RETRO_THEMES[i]
}

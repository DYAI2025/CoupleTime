import { describe, it, expect } from 'vitest'
import { RETRO_THEMES, selectThemeForSession, THEME_COUNT } from '../RetroTheme'

describe('RetroTheme', () => {
  it('has at least 6 themes', () => {
    expect(RETRO_THEMES.length).toBeGreaterThanOrEqual(6)
    expect(THEME_COUNT).toBe(RETRO_THEMES.length)
  })

  it('each theme has a unique id', () => {
    const ids = RETRO_THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of RETRO_THEMES) {
      expect(t.id).toMatch(/^[a-z-]+$/)
    }
  })

  it('rotates deterministically: session 0 -> theme 0', () => {
    expect(selectThemeForSession(0).id).toBe(RETRO_THEMES[0].id)
  })

  it('wraps around at THEME_COUNT', () => {
    expect(selectThemeForSession(THEME_COUNT).id).toBe(RETRO_THEMES[0].id)
    expect(selectThemeForSession(THEME_COUNT + 1).id).toBe(RETRO_THEMES[1].id)
  })

  it('is robust against negative indices', () => {
    expect(selectThemeForSession(-1).id).toBe(RETRO_THEMES[RETRO_THEMES.length - 1].id)
  })
})

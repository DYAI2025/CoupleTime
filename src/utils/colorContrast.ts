export interface RGB {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGB | null {
  const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return null
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  }
}

export function calculateLuminance(rgb: RGB): number {
  const linearize = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b)
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 1
  const l1 = calculateLuminance(rgb1)
  const l2 = calculateLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getContrastingTextColor(bgHex: string): '#ffffff' | '#000000' {
  const rgb = hexToRgb(bgHex)
  if (!rgb) return '#000000'
  const contrastWithWhite = calculateContrastRatio(bgHex, '#ffffff')
  const contrastWithBlack = calculateContrastRatio(bgHex, '#000000')
  return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000'
}

import { useMemo } from 'react'
import { Speaker } from '../domain/Speaker'
import { getContrastingTextColor } from '../utils/colorContrast'

export interface ParticipantBackgroundResult {
  backgroundColor: string
  textColor: string
}

export function useParticipantBackground(
  speaker: Speaker,
  colorA: string,
  colorB: string
): ParticipantBackgroundResult {
  return useMemo(() => {
    if (speaker === Speaker.A) {
      return { backgroundColor: colorA, textColor: getContrastingTextColor(colorA) }
    }
    if (speaker === Speaker.B) {
      return { backgroundColor: colorB, textColor: getContrastingTextColor(colorB) }
    }
    return { backgroundColor: 'transparent', textColor: '' }
  }, [speaker, colorA, colorB])
}

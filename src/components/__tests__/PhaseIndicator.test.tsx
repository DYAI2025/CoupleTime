import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhaseIndicator } from '../PhaseIndicator'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock i18n — simulate real i18next: known keys return their translation, not the fallback
const KNOWN_KEYS: Record<string, string> = {
  'speaker.a': 'Partner A',
  'speaker.b': 'Partner B',
  'speaker.none': '',
}
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: any) => {
      if (key in KNOWN_KEYS) return KNOWN_KEYS[key]
      if (typeof fallback === 'string') return fallback
      if (typeof fallback === 'object' && fallback?.defaultValue) return fallback.defaultValue
      return key
    },
  }),
}))

const mockViewModelBase = {
  phaseType: null,
  speaker: 'none' as const,
  currentPhaseIndex: 0,
  totalPhases: 3,
  phaseDisplayName: '',
  speakerDisplayName: 'Partner A',
  participantNameA: 'Partner A',
  participantNameB: 'Partner B',
  participantColorA: '#3b82f6',
  participantColorB: '#8b5cf6',
  modeName: null,
  modeId: null,
  status: 'idle' as const,
  isIdle: true,
  isRunning: false,
  isPaused: false,
  isFinished: false,
  remainingTimeFormatted: '0:00',
  remainingSeconds: 0,
  elapsedTimeFormatted: '0:00',
  elapsedSeconds: 0,
  phaseProgress: 0,
  sessionProgress: 0,
  phaseProgressPercent: 0,
  sessionProgressPercent: 0,
  canStart: true,
  canPause: false,
  canResume: false,
  canStop: false,
  showGuidanceTips: false,
  isSpeakerA: false,
  isSpeakerB: false,
  phaseColor: 'gray',
}

vi.mock('../../contexts/SessionContext', () => ({
  useSessionViewModel: vi.fn(() => mockViewModelBase),
}))

import { useSessionViewModel } from '../../contexts/SessionContext'
import { Speaker } from '../../domain/Speaker'
import { PhaseType } from '../../domain/PhaseType'

describe('PhaseIndicator — custom participant names', () => {
  it('shows custom name for speaker A from viewModel.speakerDisplayName', () => {
    vi.mocked(useSessionViewModel).mockReturnValue({
      ...mockViewModelBase,
      phaseType: PhaseType.SlotA,
      speaker: Speaker.A,
      isSpeakerA: true,
      speakerDisplayName: 'Alice',
      participantNameA: 'Alice',
    } as any)

    render(<PhaseIndicator />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows custom name for speaker B from viewModel.speakerDisplayName', () => {
    vi.mocked(useSessionViewModel).mockReturnValue({
      ...mockViewModelBase,
      phaseType: PhaseType.SlotB,
      speaker: Speaker.B,
      isSpeakerB: true,
      speakerDisplayName: 'Bob',
      participantNameB: 'Bob',
    } as any)

    render(<PhaseIndicator />)
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows default name Partner A when no custom name set', () => {
    vi.mocked(useSessionViewModel).mockReturnValue({
      ...mockViewModelBase,
      phaseType: PhaseType.SlotA,
      speaker: Speaker.A,
      isSpeakerA: true,
      speakerDisplayName: 'Partner A',
      participantNameA: 'Partner A',
    } as any)

    render(<PhaseIndicator />)
    expect(screen.getByText('Partner A')).toBeInTheDocument()
  })
})

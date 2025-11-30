import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  MaintainModeSlide,
  CommitmentModeSlide,
  ListeningModeSlide,
} from '../ModeBreakdownSlide'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}))

// Mock PhaseTimeline
vi.mock('../../PhaseTimeline', () => ({
  PhaseTimeline: ({ phases, totalDuration }: any) => (
    <div data-testid="phase-timeline" data-phases={phases.length} data-duration={totalDuration}>
      Phase Timeline Mock
    </div>
  ),
}))

describe('MaintainModeSlide', () => {
  it('renders Maintain mode title', () => {
    render(<MaintainModeSlide />)

    expect(screen.getByText(/Maintain Mode/i)).toBeInTheDocument()
  })

  it('shows ~90 minute duration', () => {
    render(<MaintainModeSlide />)

    expect(screen.getByText(/90/)).toBeInTheDocument()
  })

  it('shows 3 rounds', () => {
    render(<MaintainModeSlide />)

    expect(screen.getByText(/3 rounds/i)).toBeInTheDocument()
  })

  it('renders PhaseTimeline', () => {
    render(<MaintainModeSlide />)

    expect(screen.getByTestId('phase-timeline')).toBeInTheDocument()
  })
})

describe('CommitmentModeSlide', () => {
  it('renders Commitment mode title', () => {
    render(<CommitmentModeSlide />)

    expect(screen.getByText(/Commitment Mode/i)).toBeInTheDocument()
  })

  it('shows ~60 minute duration', () => {
    render(<CommitmentModeSlide />)

    expect(screen.getByText(/60/)).toBeInTheDocument()
  })

  it('shows 3 rounds', () => {
    render(<CommitmentModeSlide />)

    expect(screen.getByText(/3 rounds/i)).toBeInTheDocument()
  })

  it('mentions crisis phases usage', () => {
    render(<CommitmentModeSlide />)

    expect(screen.getByText(/crisis/i)).toBeInTheDocument()
  })
})

describe('ListeningModeSlide', () => {
  it('renders Listening mode title', () => {
    render(<ListeningModeSlide />)

    expect(screen.getByText(/Listening Mode/i)).toBeInTheDocument()
  })

  it('shows ~45 minute duration', () => {
    render(<ListeningModeSlide />)

    expect(screen.getByText(/45/)).toBeInTheDocument()
  })

  it('shows 2 rounds', () => {
    render(<ListeningModeSlide />)

    expect(screen.getByText(/2 rounds/i)).toBeInTheDocument()
  })

  it('mentions beginners', () => {
    render(<ListeningModeSlide />)

    expect(screen.getByText(/beginner/i)).toBeInTheDocument()
  })
})

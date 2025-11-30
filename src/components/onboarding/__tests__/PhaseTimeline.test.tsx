import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhaseTimeline } from '../PhaseTimeline'
import type { PhaseType } from '../../../domain/PhaseType'

describe('PhaseTimeline', () => {
  it('renders phase blocks with correct proportions', () => {
    const phases = [
      { type: 'prep' as PhaseType, durationMinutes: 5, speaker: null },
      { type: 'slotA' as PhaseType, durationMinutes: 10, speaker: 'A' as const },
      { type: 'transition' as PhaseType, durationMinutes: 1, speaker: null },
      { type: 'slotB' as PhaseType, durationMinutes: 10, speaker: 'B' as const },
    ]

    render(<PhaseTimeline phases={phases} totalDuration={26} />)

    // Should render all 4 phases
    expect(screen.getByTestId('phase-prep')).toBeInTheDocument()
    expect(screen.getByTestId('phase-slotA')).toBeInTheDocument()
    expect(screen.getByTestId('phase-transition')).toBeInTheDocument()
    expect(screen.getByTestId('phase-slotB')).toBeInTheDocument()
  })

  it('displays phase duration labels', () => {
    const phases = [
      { type: 'prep' as PhaseType, durationMinutes: 5, speaker: null },
    ]

    render(<PhaseTimeline phases={phases} totalDuration={5} />)

    expect(screen.getByText('5 min')).toBeInTheDocument()
  })
})

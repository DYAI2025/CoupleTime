import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhaseTimeline } from '../PhaseTimeline'

describe('PhaseTimeline', () => {
  it('renders phase blocks with correct proportions', () => {
    const phases = [
      { type: 'prep', durationMinutes: 5 },
      { type: 'slotA', durationMinutes: 10 },
      { type: 'transition', durationMinutes: 1 },
      { type: 'slotB', durationMinutes: 10 },
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
      { type: 'prep', durationMinutes: 5 },
    ]

    render(<PhaseTimeline phases={phases} totalDuration={5} />)

    expect(screen.getByText('5 min')).toBeInTheDocument()
  })
})

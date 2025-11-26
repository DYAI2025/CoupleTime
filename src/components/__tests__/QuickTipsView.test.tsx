import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickTipsView } from '../QuickTipsView'
import * as useTipRotationModule from '../../hooks/useTipRotation'

describe('QuickTipsView', () => {
  const mockTips = ['Tip 1', 'Tip 2', 'Tip 3', 'Tip 4', 'Tip 5']
  const mockNext = vi.fn()
  const mockPrevious = vi.fn()
  const mockGoTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with tip text from useTipRotation', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 1',
      currentIndex: 0,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    expect(screen.getByText('Tip 1')).toBeInTheDocument()
  })

  it('shows navigation buttons (previous, next)', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 3',
      currentIndex: 2,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('shows current position indicator (e.g., "3 / 5")', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 3',
      currentIndex: 2,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })

  it('calls next() when Next button clicked', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 2',
      currentIndex: 1,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('calls previous() when Previous button clicked', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 2',
      currentIndex: 1,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    const previousButton = screen.getByRole('button', { name: /previous/i })
    fireEvent.click(previousButton)

    expect(mockPrevious).toHaveBeenCalledTimes(1)
  })

  it('disables Previous on first tip (index 0)', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 1',
      currentIndex: 0,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    const previousButton = screen.getByRole('button', { name: /previous/i })
    expect(previousButton).toBeDisabled()
  })

  it('disables Next on last tip (index === total - 1)', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 5',
      currentIndex: 4,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
  })

  it('shows Lucide icons (ChevronLeft, ChevronRight)', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: 'Tip 2',
      currentIndex: 1,
      total: 5,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    const { container } = render(
      <QuickTipsView
        tips={mockTips}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    // Check that SVG icons are rendered (Lucide renders as SVG elements)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(2) // At least ChevronLeft and ChevronRight
  })

  it('renders null when tips array is empty', () => {
    vi.spyOn(useTipRotationModule, 'useTipRotation').mockReturnValue({
      current: '',
      currentIndex: 0,
      total: 0,
      next: mockNext,
      previous: mockPrevious,
      goTo: mockGoTo,
    })

    const { container } = render(
      <QuickTipsView
        tips={[]}
        autoRotate={false}
        interval={10}
        shuffleMode={false}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingSlider } from '../OnboardingSlider'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    i18n: { language: 'en' },
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock slides
const TestSlide1 = () => <div>Slide 1 Content</div>
const TestSlide2 = () => <div>Slide 2 Content</div>
const TestSlide3 = () => <div>Slide 3 Content</div>

describe('OnboardingSlider', () => {
  it('renders first slide by default', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    expect(screen.getByText('Slide 1 Content')).toBeInTheDocument()
    expect(screen.queryByText('Slide 2 Content')).not.toBeInTheDocument()
  })

  it('shows progress dots for all slides', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    const { container } = render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    const dots = container.querySelectorAll('[data-testid^="progress-dot-"]')
    expect(dots.length).toBe(3)
  })

  it('navigates to next slide when Next clicked', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    expect(screen.getByText('Slide 2 Content')).toBeInTheDocument()
    expect(screen.queryByText('Slide 1 Content')).not.toBeInTheDocument()
  })

  it('navigates to previous slide when Back clicked', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    // Go to slide 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Go back to slide 1
    fireEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByText('Slide 1 Content')).toBeInTheDocument()
  })

  it('disables Back button on first slide', () => {
    const slides = [TestSlide1, TestSlide2, TestSlide3]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    const backButton = screen.getByRole('button', { name: /back/i })
    expect(backButton).toBeDisabled()
  })

  it.skip('calls onComplete when Next clicked on last slide', async () => {
    // Create a mock slide that has a button to select a mode
    const TestSlideWithModeSelect = ({ onModeSelect }: any) => (
      <div>
        <div>Last Slide Content</div>
        <button onClick={() => onModeSelect?.({ name: 'Test Mode', phases: [] })}>
          Select Mode
        </button>
      </div>
    )

    const slides = [TestSlide1, TestSlide2, TestSlideWithModeSelect]
    const onComplete = vi.fn()

    render(<OnboardingSlider slides={slides} onComplete={onComplete} />)

    // Navigate to last slide
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // The "Start Session" button should be visible but disabled
    const startButton = screen.getByRole('button', { name: /start session/i })
    expect(startButton).toBeDisabled()

    // Select a mode to enable the Start Session button
    fireEvent.click(screen.getByRole('button', { name: /select mode/i }))

    // Wait for the button to become enabled
    await waitFor(() => {
      expect(startButton).not.toBeDisabled()
    })

    // Click it
    fireEvent.click(startButton)

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onComplete).toHaveBeenCalledWith({ name: 'Test Mode', phases: [] })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingModal } from '../OnboardingModal'

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
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock OnboardingSlider
vi.mock('../OnboardingSlider', () => ({
  OnboardingSlider: ({ onComplete }: any) => (
    <div data-testid="onboarding-slider">
      <button onClick={() => onComplete()}>Complete Onboarding</button>
    </div>
  ),
}))

describe('OnboardingModal', () => {
  it('renders modal when isOpen is true', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} onComplete={vi.fn()} />)

    expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<OnboardingModal isOpen={false} onClose={vi.fn()} onComplete={vi.fn()} />)

    expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: /close|skip/i })).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<OnboardingModal isOpen={true} onClose={onClose} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /close|skip/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('renders OnboardingSlider', () => {
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} onComplete={vi.fn()} />)

    expect(screen.getByTestId('onboarding-slider')).toBeInTheDocument()
  })

  it('calls onComplete when slider completes', () => {
    const onComplete = vi.fn()
    render(<OnboardingModal isOpen={true} onClose={vi.fn()} onComplete={onComplete} />)

    fireEvent.click(screen.getByText('Complete Onboarding'))

    expect(onComplete).toHaveBeenCalled()
  })
})

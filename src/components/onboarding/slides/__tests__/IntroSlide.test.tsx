import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IntroSlide } from '../IntroSlide'

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
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}))

describe('IntroSlide', () => {
  it('renders welcome title', () => {
    render(<IntroSlide />)

    expect(screen.getByText('Welcome to Couples Timer')).toBeInTheDocument()
  })

  it('renders subtitle about Zwiegespräch', () => {
    render(<IntroSlide />)

    expect(screen.getByText(/Your guide to structured partner conversations/i)).toBeInTheDocument()
  })

  it('renders HeartTimer icon', () => {
    render(<IntroSlide />)

    const icon = screen.getByTestId('heart-timer-icon')
    expect(icon).toBeInTheDocument()
  })

  it('renders description paragraph', () => {
    render(<IntroSlide />)

    expect(screen.getByText(/This tool helps you practice/i)).toBeInTheDocument()
  })
})

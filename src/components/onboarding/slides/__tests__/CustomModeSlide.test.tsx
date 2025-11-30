import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CustomModeSlide } from '../CustomModeSlide'

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
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
}))

describe('CustomModeSlide', () => {
  it('renders title about custom mode', () => {
    render(<CustomModeSlide />)

    expect(screen.getByRole('heading', { name: /Custom Mode/i })).toBeInTheDocument()
  })

  it('mentions advanced users', () => {
    render(<CustomModeSlide />)

    expect(screen.getByText(/advanced/i)).toBeInTheDocument()
  })

  it('explains customization options', () => {
    render(<CustomModeSlide />)

    expect(screen.getByText(/phase durations/i)).toBeInTheDocument()
  })

  it('shows custom mode icon', () => {
    render(<CustomModeSlide />)

    const icon = screen.getByTestId('custom-mode-icon')
    expect(icon).toBeInTheDocument()
  })
})

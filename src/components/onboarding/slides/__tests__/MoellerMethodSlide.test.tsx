import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MoellerMethodSlide } from '../MoellerMethodSlide'

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

describe('MoellerMethodSlide', () => {
  it('renders title about the Moeller method', () => {
    render(<MoellerMethodSlide />)

    expect(screen.getByText(/The Zwiegespräch Method/i)).toBeInTheDocument()
  })

  it('renders description of the method origin', () => {
    render(<MoellerMethodSlide />)

    expect(screen.getByText(/Michael Lukas Moeller/i)).toBeInTheDocument()
  })

  it('renders the three core principles', () => {
    render(<MoellerMethodSlide />)

    expect(screen.getByText(/Equal speaking time/i)).toBeInTheDocument()
    expect(screen.getByText(/No interruptions/i)).toBeInTheDocument()
    expect(screen.getByText(/Active listening/i)).toBeInTheDocument()
  })

  it('renders visual diagram of conversation structure', () => {
    render(<MoellerMethodSlide />)

    const diagram = screen.getByTestId('conversation-diagram')
    expect(diagram).toBeInTheDocument()
  })
})

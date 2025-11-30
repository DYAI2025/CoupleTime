import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdaptationsSlide } from '../AdaptationsSlide'

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

describe('AdaptationsSlide', () => {
  it('renders title about adaptations', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/Our Adaptations/i)).toBeInTheDocument()
  })

  it('explains the silent transition feature', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/1-minute silent transition/i)).toBeInTheDocument()
  })

  it('mentions emotional regulation benefit', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/emotional regulation/i)).toBeInTheDocument()
  })

  it('renders visual showing the transition period', () => {
    render(<AdaptationsSlide />)

    const diagram = screen.getByTestId('transition-diagram')
    expect(diagram).toBeInTheDocument()
  })

  it('explains singing bowl audio cues', () => {
    render(<AdaptationsSlide />)

    expect(screen.getByText(/singing bowl/i)).toBeInTheDocument()
  })
})

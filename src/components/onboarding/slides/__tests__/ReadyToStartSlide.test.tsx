import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReadyToStartSlide } from '../ReadyToStartSlide'

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
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
}))

describe('ReadyToStartSlide', () => {
  it('renders title about choosing mode', () => {
    render(<ReadyToStartSlide />)

    expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument()
  })

  it('shows all three preset mode options', () => {
    render(<ReadyToStartSlide />)

    expect(screen.getByRole('button', { name: /maintain/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /commitment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /listening/i })).toBeInTheDocument()
  })

  it('calls onModeSelect when a mode is clicked', () => {
    const onModeSelect = vi.fn()
    render(<ReadyToStartSlide onModeSelect={onModeSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /Listening/i }))

    expect(onModeSelect).toHaveBeenCalled()
  })

  it('shows recommendation for beginners', () => {
    render(<ReadyToStartSlide />)

    // Check subtitle contains recommendation text
    expect(screen.getByText(/We recommend starting with Listening Mode/i)).toBeInTheDocument()
  })
})

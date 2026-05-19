import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecBadge } from '../RecBadge'

describe('RecBadge', () => {
  it('renders REC text when isRecording is true', () => {
    render(<RecBadge isRecording={true} />)
    expect(screen.getByText('REC')).toBeInTheDocument()
  })

  it('renders nothing when isRecording is false', () => {
    const { container } = render(<RecBadge isRecording={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('has red dot indicator', () => {
    const { container } = render(<RecBadge isRecording={true} />)
    const dot = container.querySelector('.bg-red-500')
    expect(dot).toBeInTheDocument()
  })

  it('renders nothing when recordingEnabled is false even if isRecording somehow true', () => {
    render(<RecBadge isRecording={false} recordingEnabled={false} />)
    expect(screen.queryByText('REC')).not.toBeInTheDocument()
  })
})

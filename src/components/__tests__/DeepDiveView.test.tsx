import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeepDiveView } from '../DeepDiveView'
import { useTranslation } from 'react-i18next'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}))

describe('DeepDiveView', () => {
  const mockT = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTranslation as ReturnType<typeof vi.fn>).mockReturnValue({
      t: mockT,
      i18n: {
        language: 'en',
      },
    })
  })

  it('renders all three phase sections', () => {
    mockT.mockImplementation((key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [
            {
              title: 'Schedule Agreement',
              content: 'Set a fixed weekly time',
              icon: 'calendar',
            },
          ],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [
            {
              title: 'Radical Empathy',
              content: 'Listen with full attention',
              icon: 'heart',
            },
          ],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency Situations',
          cards: [
            {
              title: 'Call Time-Out',
              content: 'Stop when overwhelmed',
              icon: 'clock',
            },
          ],
        }
      }
      return key
    })

    render(<DeepDiveView tips={[]} showAllTips={false} />)

    expect(screen.getByText('Phase 1: Preparation')).toBeInTheDocument()
    expect(screen.getByText('Phase 2: During Listening')).toBeInTheDocument()
    expect(screen.getByText('Phase 3: Emergency Situations')).toBeInTheDocument()
  })

  it('renders section titles from i18n', () => {
    mockT.mockImplementation((key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Custom Before Title',
          cards: [],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Custom During Title',
          cards: [],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Custom Emergency Title',
          cards: [],
        }
      }
      return key
    })

    render(<DeepDiveView tips={[]} showAllTips={false} />)

    expect(screen.getByText('Custom Before Title')).toBeInTheDocument()
    expect(screen.getByText('Custom During Title')).toBeInTheDocument()
    expect(screen.getByText('Custom Emergency Title')).toBeInTheDocument()
  })

  it('renders all cards within each section', () => {
    mockT.mockImplementation((key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [
            {
              title: 'Card 1',
              content: 'Content 1',
              icon: 'calendar',
            },
            {
              title: 'Card 2',
              content: 'Content 2',
              icon: 'door-closed',
            },
          ],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [
            {
              title: 'Card 3',
              content: 'Content 3',
              icon: 'heart',
            },
          ],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency Situations',
          cards: [],
        }
      }
      return key
    })

    render(<DeepDiveView tips={[]} showAllTips={false} />)

    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.getByText('Card 3')).toBeInTheDocument()
    expect(screen.getByText('Content 3')).toBeInTheDocument()
  })

  it('displays card title, content, and icon', () => {
    mockT.mockImplementation((key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [
            {
              title: 'Schedule Agreement',
              content: 'Set a fixed weekly time',
              icon: 'calendar',
            },
          ],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency Situations',
          cards: [],
        }
      }
      return key
    })

    const { container } = render(<DeepDiveView tips={[]} showAllTips={false} />)

    // Check title and content
    expect(screen.getByText('Schedule Agreement')).toBeInTheDocument()
    expect(screen.getByText('Set a fixed weekly time')).toBeInTheDocument()

    // Check icon is rendered (SVG)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('renders with proper structure and accessibility', () => {
    mockT.mockImplementation((key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [
            {
              title: 'Schedule Agreement',
              content: 'Set a fixed weekly time',
              icon: 'calendar',
            },
          ],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency Situations',
          cards: [],
        }
      }
      return key
    })

    const { container } = render(<DeepDiveView tips={[]} showAllTips={false} />)

    // Check that sections are rendered with headings
    const headings = container.querySelectorAll('h2, h3')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('maps icon strings to SVG components', () => {
    mockT.mockImplementation((key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [
            {
              title: 'Card with Calendar',
              content: 'Content',
              icon: 'calendar',
            },
            {
              title: 'Card with Heart',
              content: 'Content',
              icon: 'heart',
            },
            {
              title: 'Card with Clock',
              content: 'Content',
              icon: 'clock',
            },
          ],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency Situations',
          cards: [],
        }
      }
      return key
    })

    const { container } = render(<DeepDiveView tips={[]} showAllTips={false} />)

    // Check that SVG icons are rendered for each card
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(3) // One icon per card
  })

  it('handles empty cards array gracefully', () => {
    mockT.mockImplementation((key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency Situations',
          cards: [],
        }
      }
      return key
    })

    const { container } = render(<DeepDiveView tips={[]} showAllTips={false} />)

    // Should still render section titles
    expect(screen.getByText('Phase 1: Preparation')).toBeInTheDocument()
    expect(screen.getByText('Phase 2: During Listening')).toBeInTheDocument()
    expect(screen.getByText('Phase 3: Emergency Situations')).toBeInTheDocument()

    // No cards should be rendered
    expect(container.querySelectorAll('.card').length).toBe(0)
  })
})

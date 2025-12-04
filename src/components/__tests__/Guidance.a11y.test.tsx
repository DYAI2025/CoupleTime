import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuickTipsView } from '../QuickTipsView'
import { DeepDiveView } from '../DeepDiveView'
import { GuidancePanel } from '../GuidancePanel'
import { createGuidanceSettings } from '../../domain/GuidanceSettings'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Mock guidance deep dive data
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [
            { title: 'Schedule Agreement', content: 'Plan together', icon: 'calendar' },
            { title: 'Create Space', content: 'Find quiet place', icon: 'door-closed' },
          ],
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [
            { title: 'Radical Empathy', content: 'Listen deeply', icon: 'heart' },
          ],
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency',
          cards: [
            { title: 'Call Time-Out', content: 'Pause if needed', icon: 'clock' },
          ],
        }
      }
      if (key === 'guidancePanel.quickTips') return 'Quick Tips'
      if (key === 'guidancePanel.deepDive') return 'Deep Dive'
      return options?.defaultValue || key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('Guidance Components - Accessibility Tests', () => {
  describe('QuickTipsView Accessibility', () => {
    const mockTips = ['Tip 1: Stay calm', 'Tip 2: Listen actively', 'Tip 3: Be present']

    it('has proper ARIA labels on navigation buttons', () => {
      render(
        <QuickTipsView
          tips={mockTips}
          autoRotate={false}
          interval={10}
          shuffleMode={false}
        />
      )

      const prevButton = screen.getByLabelText('Previous tip')
      const nextButton = screen.getByLabelText('Next tip')

      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('navigation buttons are keyboard accessible', () => {
      render(
        <QuickTipsView
          tips={mockTips}
          autoRotate={false}
          interval={10}
          shuffleMode={false}
        />
      )

      const prevButton = screen.getByLabelText('Previous tip')
      const nextButton = screen.getByLabelText('Next tip')

      // Buttons should be actual button elements (keyboard accessible by default)
      expect(prevButton.tagName).toBe('BUTTON')
      expect(nextButton.tagName).toBe('BUTTON')
    })

    it('disabled buttons have proper disabled state', () => {
      render(
        <QuickTipsView
          tips={mockTips}
          autoRotate={false}
          interval={10}
          shuffleMode={false}
        />
      )

      // On first tip, Previous should be disabled
      const prevButton = screen.getByLabelText('Previous tip')
      expect(prevButton).toBeDisabled()
    })

    it('shows current position for screen readers', () => {
      render(
        <QuickTipsView
          tips={mockTips}
          autoRotate={false}
          interval={10}
          shuffleMode={false}
        />
      )

      // Position indicator should be visible
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('tip content is readable text', () => {
      render(
        <QuickTipsView
          tips={mockTips}
          autoRotate={false}
          interval={10}
          shuffleMode={false}
        />
      )

      // First tip should be displayed as text
      expect(screen.getByText('Tip 1: Stay calm')).toBeInTheDocument()
    })
  })

  describe('DeepDiveView Accessibility', () => {
    it('uses semantic HTML with proper heading hierarchy', () => {
      render(<DeepDiveView tips={[]} showAllTips={false} />)

      // Section titles should be h2
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(sectionHeadings.length).toBeGreaterThan(0)
      expect(sectionHeadings[0]).toHaveTextContent('Phase 1: Preparation')
    })

    it('card titles use proper heading elements', () => {
      render(<DeepDiveView tips={[]} showAllTips={false} />)

      // Card titles should be h3
      const cardHeadings = screen.getAllByRole('heading', { level: 3 })
      expect(cardHeadings.length).toBeGreaterThan(0)
      expect(cardHeadings[0]).toHaveTextContent('Schedule Agreement')
    })

    it('cards have readable structure', () => {
      render(<DeepDiveView tips={[]} showAllTips={false} />)

      // Check first card has all elements
      expect(screen.getByText('Schedule Agreement')).toBeInTheDocument()
      expect(screen.getByText('Plan together')).toBeInTheDocument()
    })

    it('icons have proper visual representation', () => {
      const { container } = render(<DeepDiveView tips={[]} showAllTips={false} />)

      // Icons should be SVG elements
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('content is structured for easy navigation', () => {
      render(<DeepDiveView tips={[]} showAllTips={false} />)

      // Should have multiple sections
      const sections = screen.getAllByRole('heading', { level: 2 })
      expect(sections.length).toBe(3) // beforeSession, duringListening, emergency
    })
  })

  describe('GuidancePanel Accessibility', () => {
    const mockSettings = createGuidanceSettings()
    const mockOnChange = vi.fn()
    const mockTips = ['Tip 1', 'Tip 2']

    it('mode toggle buttons have ARIA labels', () => {
      render(
        <GuidancePanel
          settings={mockSettings}
          onSettingsChange={mockOnChange}
          currentPhaseTips={mockTips}
        />
      )

      const quickTipsButton = screen.getByLabelText('Quick Tips')
      const deepDiveButton = screen.getByLabelText('Deep Dive')

      expect(quickTipsButton).toBeInTheDocument()
      expect(deepDiveButton).toBeInTheDocument()
    })

    it('mode toggle buttons are keyboard accessible', () => {
      render(
        <GuidancePanel
          settings={mockSettings}
          onSettingsChange={mockOnChange}
          currentPhaseTips={mockTips}
        />
      )

      const quickTipsButton = screen.getByLabelText('Quick Tips')
      const deepDiveButton = screen.getByLabelText('Deep Dive')

      expect(quickTipsButton.tagName).toBe('BUTTON')
      expect(deepDiveButton.tagName).toBe('BUTTON')
    })

    it('active mode is visually indicated', () => {
      render(
        <GuidancePanel
          settings={createGuidanceSettings({ guidanceMode: 'quick' })}
          onSettingsChange={mockOnChange}
          currentPhaseTips={mockTips}
        />
      )

      const quickTipsButton = screen.getByLabelText('Quick Tips')

      // Active button should have distinguishing class
      expect(quickTipsButton).toHaveClass('bg-indigo-600')
    })

    it('panel is positioned accessibly (not overlapping content)', () => {
      const { container } = render(
        <GuidancePanel
          settings={mockSettings}
          onSettingsChange={mockOnChange}
          currentPhaseTips={mockTips}
        />
      )

      const panel = container.firstChild as HTMLElement

      // Panel should have fixed positioning
      expect(panel).toHaveClass('fixed', 'bottom-0')
    })

    it('content area is scrollable for overflow', () => {
      const { container } = render(
        <GuidancePanel
          settings={createGuidanceSettings({ guidanceMode: 'deep-dive' })}
          onSettingsChange={mockOnChange}
          currentPhaseTips={mockTips}
        />
      )

      // Content area should allow scrolling
      const scrollableArea = container.querySelector('.overflow-y-auto')
      expect(scrollableArea).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('QuickTipsView buttons are focusable', () => {
      render(
        <QuickTipsView
          tips={['Tip 1', 'Tip 2']}
          autoRotate={false}
          interval={10}
          shuffleMode={false}
        />
      )

      const nextButton = screen.getByLabelText('Next tip')
      nextButton.focus()

      expect(document.activeElement).toBe(nextButton)
    })

    it('GuidancePanel mode toggles are focusable', () => {
      render(
        <GuidancePanel
          settings={createGuidanceSettings()}
          onSettingsChange={vi.fn()}
          currentPhaseTips={['Tip 1']}
        />
      )

      const quickTipsButton = screen.getByLabelText('Quick Tips')
      quickTipsButton.focus()

      expect(document.activeElement).toBe(quickTipsButton)
    })
  })

  describe('Color Contrast and Visibility', () => {
    it('QuickTipsView has sufficient text contrast', () => {
      render(
        <QuickTipsView
          tips={['Test tip']}
          autoRotate={false}
          interval={10}
          shuffleMode={false}
        />
      )

      const tipText = screen.getByText('Test tip')

      // Text should be visible (not hidden or transparent)
      expect(tipText).toBeVisible()
    })

    it('DeepDiveView cards have visible text', () => {
      render(<DeepDiveView tips={[]} showAllTips={false} />)

      const cardTitle = screen.getByText('Schedule Agreement')
      const cardContent = screen.getByText('Plan together')

      expect(cardTitle).toBeVisible()
      expect(cardContent).toBeVisible()
    })

    it('GuidancePanel buttons have clear active/inactive states', () => {
      render(
        <GuidancePanel
          settings={createGuidanceSettings({ guidanceMode: 'quick' })}
          onSettingsChange={vi.fn()}
          currentPhaseTips={['Tip']}
        />
      )

      const activeButton = screen.getByLabelText('Quick Tips')
      const inactiveButton = screen.getByLabelText('Deep Dive')

      // Active should have different styling
      expect(activeButton.className).not.toBe(inactiveButton.className)
    })
  })
})

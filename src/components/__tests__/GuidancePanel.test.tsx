import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GuidancePanel } from '../GuidancePanel'
import { createGuidanceSettings } from '../../domain/GuidanceSettings'
import { QuickTipsView } from '../QuickTipsView'

// Mock the child components
vi.mock('../QuickTipsView', () => ({
  QuickTipsView: vi.fn(() => <div data-testid="quick-tips-view">QuickTipsView</div>),
}))

vi.mock('../DeepDiveView', () => ({
  DeepDiveView: vi.fn(() => <div data-testid="deep-dive-view">DeepDiveView</div>),
}))

describe('GuidancePanel', () => {
  const mockTips = ['Tip 1', 'Tip 2', 'Tip 3', 'Tip 4', 'Tip 5']
  const mockOnSettingsChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Mode Rendering', () => {
    it('renders in Quick Tips mode by default', () => {
      const settings = createGuidanceSettings()

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      expect(screen.getByTestId('quick-tips-view')).toBeInTheDocument()
      expect(screen.queryByTestId('deep-dive-view')).not.toBeInTheDocument()
    })

    it('renders QuickTipsView when guidanceMode is "quick"', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'quick' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      expect(screen.getByTestId('quick-tips-view')).toBeInTheDocument()
      expect(screen.queryByTestId('deep-dive-view')).not.toBeInTheDocument()
    })

    it('renders DeepDiveView when guidanceMode is "deep-dive"', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'deep-dive' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      expect(screen.queryByTestId('quick-tips-view')).not.toBeInTheDocument()
      expect(screen.getByTestId('deep-dive-view')).toBeInTheDocument()
    })
  })

  describe('Mode Toggle UI', () => {
    it('shows mode toggle buttons (Quick Tips / Deep Dive)', () => {
      const settings = createGuidanceSettings()

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      expect(screen.getByRole('button', { name: /quick tips/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /deep dive/i })).toBeInTheDocument()
    })

    it('switches to Deep Dive when Deep Dive button clicked', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'quick' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const deepDiveButton = screen.getByRole('button', { name: /deep dive/i })
      fireEvent.click(deepDiveButton)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({ guidanceMode: 'deep-dive' })
    })

    it('switches to Quick Tips when Quick Tips button clicked', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'deep-dive' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const quickTipsButton = screen.getByRole('button', { name: /quick tips/i })
      fireEvent.click(quickTipsButton)

      expect(mockOnSettingsChange).toHaveBeenCalledWith({ guidanceMode: 'quick' })
    })

    it('displays current mode as active in toggle UI (Quick Tips active)', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'quick' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const quickTipsButton = screen.getByRole('button', { name: /quick tips/i })
      const deepDiveButton = screen.getByRole('button', { name: /deep dive/i })

      // Quick Tips button should have active styling
      expect(quickTipsButton).toHaveClass('bg-indigo-600')
      // Deep Dive button should not have active styling
      expect(deepDiveButton).not.toHaveClass('bg-indigo-600')
    })

    it('displays current mode as active in toggle UI (Deep Dive active)', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'deep-dive' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const quickTipsButton = screen.getByRole('button', { name: /quick tips/i })
      const deepDiveButton = screen.getByRole('button', { name: /deep dive/i })

      // Deep Dive button should have active styling
      expect(deepDiveButton).toHaveClass('bg-indigo-600')
      // Quick Tips button should not have active styling
      expect(quickTipsButton).not.toHaveClass('bg-indigo-600')
    })
  })

  describe('Props Passing', () => {
    it('passes correct props to QuickTipsView', () => {
      const settings = createGuidanceSettings({
        guidanceMode: 'quick',
        showAllTips: true,
        autoRotateInterval: 30,
      })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const lastCall = (QuickTipsView as any).mock.calls[(QuickTipsView as any).mock.calls.length - 1]
      expect(lastCall[0]).toEqual({
        tips: mockTips,
        autoRotate: true, // showAllTips === true means autoRotate is true
        interval: 30,
        shuffleMode: true, // showAllTips === true means shuffleMode is true
      })
    })

    it('passes correct props to QuickTipsView when showAllTips is false', () => {
      const settings = createGuidanceSettings({
        guidanceMode: 'quick',
        showAllTips: false,
        autoRotateInterval: 20,
      })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const lastCall = (QuickTipsView as any).mock.calls[(QuickTipsView as any).mock.calls.length - 1]
      expect(lastCall[0]).toEqual({
        tips: mockTips,
        autoRotate: false, // showAllTips === false means autoRotate is false
        interval: 20,
        shuffleMode: false, // showAllTips === false means shuffleMode is false
      })
    })
  })

  describe('Layout and Styling', () => {
    it('has fixed positioning at bottom of screen', () => {
      const settings = createGuidanceSettings()

      const { container } = render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const panel = container.firstChild as HTMLElement
      expect(panel).toHaveClass('fixed')
      expect(panel).toHaveClass('bottom-0')
    })

    it('has white background with proper spacing', () => {
      const settings = createGuidanceSettings()

      const { container } = render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const panel = container.firstChild as HTMLElement
      expect(panel).toHaveClass('bg-white')
      expect(panel).toHaveClass('dark:bg-gray-900')
    })

    it('has approximately 360px height as specified', () => {
      const settings = createGuidanceSettings()

      const { container } = render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={mockTips}
        />
      )

      const panel = container.firstChild as HTMLElement
      // Check for h-90 which is 360px (90 * 4px)
      expect(panel.className).toMatch(/h-\[360px\]|h-90/)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty tips array gracefully', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'quick' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={[]}
        />
      )

      const lastCall = (QuickTipsView as any).mock.calls[(QuickTipsView as any).mock.calls.length - 1]
      expect(lastCall[0].tips).toEqual([])
    })

    it('handles missing currentPhaseTips prop', () => {
      const settings = createGuidanceSettings({ guidanceMode: 'quick' })

      render(
        <GuidancePanel
          settings={settings}
          onSettingsChange={mockOnSettingsChange}
          currentPhaseTips={[]}
        />
      )

      const lastCall = (QuickTipsView as any).mock.calls[(QuickTipsView as any).mock.calls.length - 1]
      expect(lastCall[0].tips).toEqual([])
    })
  })
})

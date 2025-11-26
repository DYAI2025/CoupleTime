import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuickTipsView } from './QuickTipsView'
import { DeepDiveView } from './DeepDiveView'
import { GuidancePanel } from './GuidancePanel'

// Mock session context with some tips
const mockTips = ['tip.1', 'tip.2', 'tip.3']
const mockSessionState = {
  viewModel: {
    currentPhaseIndex: 0,
    currentPhaseName: 'Preparation',
    currentSpeaker: null,
    speakerDisplayName: 'None',
    remainingTime: 60,
    progressFraction: 0.5,
    isRunning: true,
    isPaused: false,
    isFinished: false,
    showGuidanceTips: true,
    participantNameA: 'Partner A',
    participantNameB: 'Partner B',
    participantColorA: '#3b82f6',
    participantColorB: '#8b5cf6',
  },
  state: {
    status: 'running',
    mode: undefined,
    currentPhaseIndex: 0,
    remainingTime: 60,
    elapsedSessionTime: 0,
    startedAt: Date.now(),
    pausedAt: null,
    totalPausedTime: 0,
    participantConfig: null
  },
  tips: mockTips,
  randomTip: 'tip.1',
  start: async () => true,
  pause: () => {},
  resume: () => {},
  stop: () => {},
  presets: [],
  customModes: [],
  addCustomMode: () => {},
  updateCustomMode: () => {},
  deleteCustomMode: () => {},
  showGuidanceTips: true,
}

// Mock the contexts
vi.mock('../contexts/SessionContext', () => ({
  useSession: () => mockSessionState,
  useSessionViewModel: () => mockSessionState.viewModel,
  useSessionActions: () => ({
    start: async () => true,
    pause: () => {},
    resume: () => {},
    stop: () => {},
  }),
  useAvailableModes: () => [],
  useCustomModes: () => ({
    customModes: [],
    addCustomMode: () => {},
    updateCustomMode: () => {},
    deleteCustomMode: () => {}
  }),
}))

describe('Guidance Components Accessibility Tests', () => {
  beforeEach(() => {
    // Reset DOM between tests
    document.body.innerHTML = ''
  })

  describe('QuickTipsView', () => {
    it('has proper ARIA attributes for navigation', () => {
      render(<QuickTipsView showAllTips={true} />)

      // Check that navigation buttons have proper ARIA labels
      const prevButton = screen.getByLabelText(/previous tip/i)
      const nextButton = screen.getByLabelText(/next tip/i)
      const indicatorButtons = screen.getAllByLabelText(/go to tip/i)

      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
      expect(indicatorButtons).toHaveLength(mockTips.length)

      // Check that buttons have proper roles
      expect(prevButton).toHaveAttribute('role', 'button')
      expect(nextButton).toHaveAttribute('role', 'button')
      indicatorButtons.forEach(button => {
        expect(button).toHaveAttribute('role', 'button')
      })
    })

    it('supports keyboard navigation', () => {
      render(<QuickTipsView showAllTips={true} />)

      const prevButton = screen.getByLabelText(/previous tip/i)
      const nextButton = screen.getByLabelText(/next tip/i)

      // Check that buttons are focusable
      expect(prevButton).toHaveAttribute('tabindex', '0')
      expect(nextButton).toHaveAttribute('tabindex', '0')
    })

    it('has semantic HTML structure', () => {
      render(<QuickTipsView showAllTips={true} />)

      // Check for proper semantic elements
      const tipText = screen.getByText(/tip\.1/i) // The actual tip content

      expect(tipText).toBeInTheDocument()
    })
  })

  describe('DeepDiveView', () => {
    it('has proper ARIA attributes for tip cards', () => {
      render(<DeepDiveView showAllTips={true} />)

      // Find tip cards by role
      const tipCards = screen.getAllByRole('region')
      
      expect(tipCards).toHaveLength(mockTips.length)
      
      // Each card should have proper ARIA labels
      tipCards.forEach((card, index) => {
        expect(card).toHaveAttribute('aria-labelledby', `tip-card-${index}`)
      })
    })

    it('has semantic heading structure', () => {
      render(<DeepDiveView showAllTips={true} />)

      // Check for proper headings
      const tipHeadings = screen.getAllByText(/Tip \d+/i)
      expect(tipHeadings).toHaveLength(mockTips.length)
    })

    it('renders when no tips are available', () => {
      // Create a mock for this specific test
      const mockSessionStateNoTips = {
        ...mockSessionState,
        tips: [],
        randomTip: null,
      }

      vi.mock('../contexts/SessionContext', () => ({
        useSession: () => mockSessionStateNoTips,
        useSessionViewModel: () => mockSessionStateNoTips.viewModel,
        useSessionActions: () => ({
          start: async () => true,
          pause: () => {},
          resume: () => {},
          stop: () => {},
        }),
        useAvailableModes: () => [],
        useCustomModes: () => ({
          customModes: [],
          addCustomMode: () => {},
          updateCustomMode: () => {},
          deleteCustomMode: () => {}
        }),
      }))

      render(<DeepDiveView />)
      
      const noTipsMessage = screen.getByText(/No tips available for this phase/i)
      expect(noTipsMessage).toBeInTheDocument()
    })
  })

  describe('GuidancePanel', () => {
    it('has proper ARIA attributes for tab structure', () => {
      render(<GuidancePanel guidanceMode="quick" />)

      // Check for tab elements
      const quickTab = screen.getByRole('tab', { name: /Quick Tips/i })
      const deepDiveTab = screen.getByRole('tab', { name: /Deep Dive/i })

      expect(quickTab).toBeInTheDocument()
      expect(deepDiveTab).toBeInTheDocument()

      // Check that tabs have proper ARIA attributes
      expect(quickTab).toHaveAttribute('aria-selected')
      expect(deepDiveTab).toHaveAttribute('aria-selected')
      expect(quickTab).toHaveAttribute('role', 'tab')
      expect(deepDiveTab).toHaveAttribute('role', 'tab')
    })

    it('has proper ARIA attributes for tabpanel', () => {
      render(<GuidancePanel guidanceMode="quick" />)

      // Check that there's a tabpanel for the selected content
      const tabPanel = screen.getByRole('tabpanel')
      expect(tabPanel).toBeInTheDocument()

      // Check that the tabpanel is properly associated with the active tab
      const activeTab = screen.getByRole('tab', { selected: true })
      expect(activeTab).toHaveAttribute('aria-controls')
    })

    it('supports keyboard navigation between modes', () => {
      render(<GuidancePanel guidanceMode="quick" />)

      const quickTab = screen.getByRole('tab', { name: /Quick Tips/i })
      const deepDiveTab = screen.getByRole('tab', { name: /Deep Dive/i })

      // Check that tabs are focusable and can be clicked
      expect(quickTab).toHaveAttribute('tabindex', '0')
      expect(deepDiveTab).toHaveAttribute('tabindex', '0')

      // Test switching between tabs
      fireEvent.click(deepDiveTab)
      expect(deepDiveTab).toHaveAttribute('aria-selected', 'true')
      expect(quickTab).toHaveAttribute('aria-selected', 'false')
    })

    it('hides when no guidance tips should be shown', () => {
      // Create a mock that hides guidance
      const mockSessionStateNoGuidance = {
        ...mockSessionState,
        viewModel: {
          ...mockSessionState.viewModel,
          showGuidanceTips: false,
        }
      }

      vi.mock('../contexts/SessionContext', () => ({
        useSession: () => mockSessionStateNoGuidance,
        useSessionViewModel: () => mockSessionStateNoGuidance.viewModel,
        useSessionActions: () => ({
          start: async () => true,
          pause: () => {},
          resume: () => {},
          stop: () => {},
        }),
        useAvailableModes: () => [],
        useCustomModes: () => ({
          customModes: [],
          addCustomMode: () => {},
          updateCustomMode: () => {},
          deleteCustomMode: () => {}
        }),
      }))

      render(<GuidancePanel />)

      // The panel should not render anything when showGuidanceTips is false
      const tablist = screen.queryByRole('tablist')
      expect(tablist).not.toBeInTheDocument()
    })
  })
})
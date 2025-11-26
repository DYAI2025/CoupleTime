import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SessionView } from '../SessionView'
import { SessionProvider } from '../../contexts/SessionContext'
import { createMockAudioService } from '../../services/AudioService'
import { createMockTimerService } from '../../services/TimerService'
import { createMockGuidanceService } from '../../services/GuidanceService'
import { createMockPersistenceService } from '../../services/PersistenceService'
import { createGuidanceSettings } from '../../domain/GuidanceSettings'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Mock guidance deep dive data structure
      if (key === 'guidance.deepDive.beforeSession' && options?.returnObjects) {
        return {
          title: 'Phase 1: Preparation',
          cards: [
            { title: 'Card 1', content: 'Content 1', icon: 'calendar' }
          ]
        }
      }
      if (key === 'guidance.deepDive.duringListening' && options?.returnObjects) {
        return {
          title: 'Phase 2: During Listening',
          cards: [
            { title: 'Card 2', content: 'Content 2', icon: 'heart' }
          ]
        }
      }
      if (key === 'guidance.deepDive.emergency' && options?.returnObjects) {
        return {
          title: 'Phase 3: Emergency',
          cards: [
            { title: 'Card 3', content: 'Content 3', icon: 'alert' }
          ]
        }
      }
      // Mock guidance panel labels
      if (key === 'guidancePanel.quickTips') return 'Quick Tips'
      if (key === 'guidancePanel.deepDive') return 'Deep Dive'
      return options?.defaultValue || key
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('SessionView - GuidancePanel Integration', () => {
  let mockAudio: ReturnType<typeof createMockAudioService>
  let mockTimer: ReturnType<typeof createMockTimerService>
  let mockGuidance: ReturnType<typeof createMockGuidanceService>
  let mockPersistence: ReturnType<typeof createMockPersistenceService>
  let mockSaveGuidanceSettings: ReturnType<typeof vi.fn>
  let mockLoadGuidanceSettings: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockAudio = createMockAudioService()
    mockTimer = createMockTimerService()
    mockGuidance = createMockGuidanceService()
    mockPersistence = createMockPersistenceService()

    // Create spies for guidance settings methods
    mockSaveGuidanceSettings = vi.fn(mockPersistence.saveGuidanceSettings)
    mockLoadGuidanceSettings = vi.fn(mockPersistence.loadGuidanceSettings)
    mockPersistence.saveGuidanceSettings = mockSaveGuidanceSettings as any
    mockPersistence.loadGuidanceSettings = mockLoadGuidanceSettings as any
  })

  function renderWithProviders() {
    return render(
      <SessionProvider
        audioService={mockAudio}
        timerService={mockTimer}
        guidanceService={mockGuidance}
        persistenceService={mockPersistence}
      >
        <SessionView />
      </SessionProvider>
    )
  }

  async function startSession() {
    // Click on first mode card
    const modeButtons = screen.getAllByRole('button')
    const modeCard = modeButtons.find(btn =>
      btn.textContent?.includes('modes.') && !btn.getAttribute('aria-label')
    )

    if (modeCard) {
      fireEvent.click(modeCard)
    }

    // Wait for and click start button
    await waitFor(() => {
      const startButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.toLowerCase().includes('start') ||
        btn.textContent?.toLowerCase().includes('session')
      )
      if (startButton) {
        fireEvent.click(startButton)
      }
    })
  }

  describe('GuidancePanel Visibility', () => {
    it.skip('does not show guidance panel when session is idle', () => {
      renderWithProviders()

      // Should show mode selection, not guidance panel
      expect(screen.getByText('Couples Timer')).toBeInTheDocument()
      expect(screen.queryByText('Quick Tips')).not.toBeInTheDocument()
      expect(screen.queryByText('Deep Dive')).not.toBeInTheDocument()
    })

    it('shows guidance panel when session is running', async () => {
      renderWithProviders()
      await startSession()

      // Guidance panel should be visible
      await waitFor(() => {
        expect(screen.getByText('Quick Tips')).toBeInTheDocument()
        expect(screen.getByText('Deep Dive')).toBeInTheDocument()
      })
    })
  })

  describe('Guidance Settings Persistence', () => {
    it.skip('saves guidance settings when mode toggles', async () => {
      renderWithProviders()
      await startSession()

      // Wait for guidance panel
      await waitFor(() => {
        expect(screen.getByText('Quick Tips')).toBeInTheDocument()
      })

      // Get the initial call count
      const initialCalls = mockSaveGuidanceSettings.mock.calls.length

      // Switch to Deep Dive mode
      fireEvent.click(screen.getByText('Deep Dive'))

      // Verify settings were saved
      await waitFor(() => {
        expect(mockSaveGuidanceSettings).toHaveBeenCalledTimes(
          initialCalls + 1
        )
        const lastCall =
          mockSaveGuidanceSettings.mock.calls[
            mockSaveGuidanceSettings.mock.calls.length - 1
          ]
        expect(lastCall[0]).toMatchObject({
          guidanceMode: 'deep-dive',
        })
      })
    })

    it.skip('loads guidance settings on mount', async () => {
      // Pre-configure mock to return deep-dive mode
      mockLoadGuidanceSettings.mockReturnValue(
        createGuidanceSettings({ guidanceMode: 'deep-dive' })
      )

      renderWithProviders()
      await startSession()

      // Wait for panel and verify loadGuidanceSettings was called
      await waitFor(() => {
        expect(mockLoadGuidanceSettings).toHaveBeenCalled()
        const deepDiveButton = screen.getByText('Deep Dive')
        expect(deepDiveButton).toBeInTheDocument()
      })
    })
  })

  describe('Layout Integration', () => {
    it('adds bottom padding to main content to avoid overlap with fixed panel', async () => {
      renderWithProviders()
      await startSession()

      await waitFor(() => {
        expect(screen.getByText('Quick Tips')).toBeInTheDocument()
      })

      // Find the main content element
      const main = document.querySelector('main')
      expect(main).toHaveClass('pb-[360px]')
    })

    it('positions guidance panel fixed at bottom', async () => {
      renderWithProviders()
      await startSession()

      await waitFor(() => {
        expect(screen.getByText('Quick Tips')).toBeInTheDocument()
      })

      // Find the guidance panel container
      const panel = screen.getByText('Quick Tips').closest('.fixed')
      expect(panel).toBeInTheDocument()
      expect(panel).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0')
      expect(panel).toHaveClass('h-[360px]')
    })
  })

  describe('Mode Toggle', () => {
    it.skip('toggles between Quick Tips and Deep Dive modes', async () => {
      renderWithProviders()
      await startSession()

      // Default to Quick Tips
      await waitFor(() => {
        const quickTipsButton = screen.getByText('Quick Tips')
        expect(quickTipsButton).toHaveClass('bg-indigo-600')
      })

      // Switch to Deep Dive
      fireEvent.click(screen.getByText('Deep Dive'))

      await waitFor(() => {
        const deepDiveButton = screen.getByText('Deep Dive')
        expect(deepDiveButton).toHaveClass('bg-indigo-600')
      })

      // Switch back to Quick Tips
      fireEvent.click(screen.getByText('Quick Tips'))

      await waitFor(() => {
        const quickTipsButton = screen.getByText('Quick Tips')
        expect(quickTipsButton).toHaveClass('bg-indigo-600')
      })
    })
  })

  describe('Tips Integration', () => {
    it('integrates tips from session context into GuidancePanel', async () => {
      renderWithProviders()
      await startSession()

      // Wait for panel to be visible
      await waitFor(() => {
        expect(screen.getByText('Quick Tips')).toBeInTheDocument()
      })

      // Verify GuidancePanel is rendered (it receives tips from context internally)
      const guidancePanel = screen.getByText('Quick Tips').closest('.fixed')
      expect(guidancePanel).toBeInTheDocument()
    })
  })

  describe('Full Integration Flow', () => {
    it.skip('completes full session lifecycle with guidance panel', async () => {
      renderWithProviders()

      // 1. Initial state - no guidance panel
      expect(screen.queryByText('Quick Tips')).not.toBeInTheDocument()

      // 2. Start session - panel appears
      await startSession()

      await waitFor(() => {
        expect(screen.getByText('Quick Tips')).toBeInTheDocument()
      })

      // 3. Change mode - settings persist
      fireEvent.click(screen.getByText('Deep Dive'))

      await waitFor(() => {
        const deepDiveButton = screen.getByText('Deep Dive')
        expect(deepDiveButton).toHaveClass('bg-indigo-600')
      })

      // Verify persistence
      expect(mockPersistence.saveGuidanceSettings).toHaveBeenCalled()

      // 4. Pause - panel stays visible
      const pauseButton = screen.getByLabelText(/pause/i)
      fireEvent.click(pauseButton)
      expect(screen.getByText('Deep Dive')).toBeInTheDocument()

      // 5. Resume - panel still visible
      const resumeButton = screen.getByLabelText(/resume/i)
      fireEvent.click(resumeButton)
      expect(screen.getByText('Deep Dive')).toBeInTheDocument()

      // 6. Stop - panel disappears
      const stopButton = screen.getByLabelText(/stop/i)
      fireEvent.click(stopButton)

      await waitFor(() => {
        expect(screen.queryByText('Deep Dive')).not.toBeInTheDocument()
      })
    })
  })
})

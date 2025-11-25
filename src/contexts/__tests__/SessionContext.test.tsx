import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import {
  SessionProvider,
  useSession,
  useSessionViewModel,
  useSessionActions,
  useAvailableModes,
  useCustomModes,
} from '../SessionContext'
import { SessionStatus } from '../../domain/SessionState'
import { MAINTAIN_MODE, COMMITMENT_MODE, LISTENING_MODE } from '../../domain/SessionMode.presets'
import { createMockAudioService } from '../../services/AudioService'
import { createMockTimerService } from '../../services/TimerService'
import { createMockGuidanceService } from '../../services/GuidanceService'
import { createMockPersistenceService } from '../../services/PersistenceService'
import { createCustomMode } from '../../domain/SessionMode'
import { createPhaseConfig } from '../../domain/PhaseConfig'
import { PhaseType } from '../../domain/PhaseType'
import { GuidanceLevel } from '../../domain/GuidanceLevel'
import React from 'react'

describe('SessionContext', () => {
  let audioService: ReturnType<typeof createMockAudioService>
  let timerService: ReturnType<typeof createMockTimerService>
  let guidanceService: ReturnType<typeof createMockGuidanceService>
  let persistenceService: ReturnType<typeof createMockPersistenceService>

  beforeEach(() => {
    audioService = createMockAudioService()
    timerService = createMockTimerService()
    guidanceService = createMockGuidanceService()
    persistenceService = createMockPersistenceService()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider
      audioService={audioService}
      timerService={timerService}
      guidanceService={guidanceService}
      persistenceService={persistenceService}
    >
      {children}
    </SessionProvider>
  )

  describe('SessionProvider', () => {
    it('provides initial idle state', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      expect(result.current.viewModel.isIdle).toBe(true)
      expect(result.current.state.status).toBe(SessionStatus.Idle)
    })

    it('provides preset modes', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      expect(result.current.presets).toHaveLength(3)
      expect(result.current.presets).toContain(MAINTAIN_MODE)
      expect(result.current.presets).toContain(COMMITMENT_MODE)
      expect(result.current.presets).toContain(LISTENING_MODE)
    })

    it('provides empty custom modes initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      expect(result.current.customModes).toHaveLength(0)
    })
  })

  describe('useSession hook', () => {
    it('throws when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useSession())
      }).toThrow('useSession must be used within a SessionProvider')

      consoleError.mockRestore()
    })
  })

  describe('Session actions', () => {
    it('start() begins a session', async () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      await act(async () => {
        const success = await result.current.start(MAINTAIN_MODE)
        expect(success).toBe(true)
      })

      expect(result.current.viewModel.isRunning).toBe(true)
      expect(result.current.viewModel.modeName).toBe(MAINTAIN_MODE.name)
    })

    it('pause() pauses a running session', async () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      await act(async () => {
        await result.current.start(MAINTAIN_MODE)
      })

      act(() => {
        result.current.pause()
      })

      expect(result.current.viewModel.isPaused).toBe(true)
    })

    it('resume() resumes a paused session', async () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      await act(async () => {
        await result.current.start(MAINTAIN_MODE)
      })

      act(() => {
        result.current.pause()
      })

      act(() => {
        result.current.resume()
      })

      expect(result.current.viewModel.isRunning).toBe(true)
    })

    it('stop() stops a session', async () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      await act(async () => {
        await result.current.start(MAINTAIN_MODE)
      })

      act(() => {
        result.current.stop()
      })

      expect(result.current.viewModel.isIdle).toBe(true)
    })
  })

  describe('Custom modes', () => {
    const testMode = createCustomMode('Test Mode', [
      createPhaseConfig(PhaseType.SlotA, 300),
      createPhaseConfig(PhaseType.SlotB, 300),
      createPhaseConfig(PhaseType.Cooldown, 300),
    ], GuidanceLevel.Minimal)

    it('addCustomMode adds a mode', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      act(() => {
        result.current.addCustomMode(testMode)
      })

      expect(result.current.customModes).toHaveLength(1)
      expect(result.current.customModes[0].name).toBe('Test Mode')
    })

    it('updateCustomMode updates a mode', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      act(() => {
        result.current.addCustomMode(testMode)
      })

      const updated = { ...testMode, name: 'Updated Mode' }

      act(() => {
        result.current.updateCustomMode(updated)
      })

      expect(result.current.customModes[0].name).toBe('Updated Mode')
    })

    it('deleteCustomMode removes a mode', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      act(() => {
        result.current.addCustomMode(testMode)
      })

      expect(result.current.customModes).toHaveLength(1)

      act(() => {
        result.current.deleteCustomMode(testMode.id)
      })

      expect(result.current.customModes).toHaveLength(0)
    })
  })

  describe('useSessionViewModel hook', () => {
    it('returns view model', () => {
      const { result } = renderHook(() => useSessionViewModel(), { wrapper })

      expect(result.current.isIdle).toBe(true)
      expect(result.current.canStart).toBe(true)
    })
  })

  describe('useSessionActions hook', () => {
    it('returns action functions', () => {
      const { result } = renderHook(() => useSessionActions(), { wrapper })

      expect(typeof result.current.start).toBe('function')
      expect(typeof result.current.pause).toBe('function')
      expect(typeof result.current.resume).toBe('function')
      expect(typeof result.current.stop).toBe('function')
    })
  })

  describe('useAvailableModes hook', () => {
    it('returns presets and custom modes combined', () => {
      const testMode = createCustomMode('Test', [
        createPhaseConfig(PhaseType.SlotA, 300),
        createPhaseConfig(PhaseType.SlotB, 300),
        createPhaseConfig(PhaseType.Cooldown, 300),
      ], GuidanceLevel.Minimal)

      persistenceService.addCustomMode(testMode)

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionProvider
          audioService={audioService}
          timerService={timerService}
          guidanceService={guidanceService}
          persistenceService={persistenceService}
        >
          {children}
        </SessionProvider>
      )

      const { result } = renderHook(() => useAvailableModes(), { wrapper: customWrapper })

      expect(result.current).toHaveLength(4) // 3 presets + 1 custom
    })
  })

  describe('useCustomModes hook', () => {
    it('returns custom modes and management functions', () => {
      const { result } = renderHook(() => useCustomModes(), { wrapper })

      expect(Array.isArray(result.current.customModes)).toBe(true)
      expect(typeof result.current.addCustomMode).toBe('function')
      expect(typeof result.current.updateCustomMode).toBe('function')
      expect(typeof result.current.deleteCustomMode).toBe('function')
    })
  })

  describe('Tips', () => {
    it('provides tips array', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      expect(Array.isArray(result.current.tips)).toBe(true)
    })

    it('provides random tip', () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      // Initially null (no mode running)
      expect(result.current.randomTip).toBeNull()
    })
  })
})

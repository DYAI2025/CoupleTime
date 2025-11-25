import { describe, it, expect } from 'vitest'
import {
  SessionStatus,
  SessionState,
  createInitialState,
  isSessionActive,
  isSessionRunning,
  isSessionPaused,
  isSessionFinished,
  isSessionIdle,
  getCurrentPhase,
  isLastPhase,
  getPhaseProgress,
  getSessionProgress,
  getRemainingPhaseCount,
} from '../SessionState'
import { MAINTAIN_MODE } from '../SessionMode.presets'
import { PhaseType } from '../PhaseType'

describe('SessionState', () => {
  describe('SessionStatus', () => {
    it('has all required statuses', () => {
      expect(SessionStatus.Idle).toBe('idle')
      expect(SessionStatus.Running).toBe('running')
      expect(SessionStatus.Paused).toBe('paused')
      expect(SessionStatus.Finished).toBe('finished')
    })
  })

  describe('createInitialState', () => {
    it('creates idle state with null mode', () => {
      const state = createInitialState()
      expect(state.status).toBe(SessionStatus.Idle)
      expect(state.mode).toBeNull()
      expect(state.currentPhaseIndex).toBe(0)
      expect(state.remainingTime).toBe(0)
      expect(state.elapsedSessionTime).toBe(0)
      expect(state.startedAt).toBeNull()
      expect(state.pausedAt).toBeNull()
      expect(state.totalPausedTime).toBe(0)
    })
  })

  describe('status helpers', () => {
    it('isSessionActive returns true for running', () => {
      const state: SessionState = { ...createInitialState(), status: SessionStatus.Running }
      expect(isSessionActive(state)).toBe(true)
    })

    it('isSessionActive returns true for paused', () => {
      const state: SessionState = { ...createInitialState(), status: SessionStatus.Paused }
      expect(isSessionActive(state)).toBe(true)
    })

    it('isSessionActive returns false for idle', () => {
      const state = createInitialState()
      expect(isSessionActive(state)).toBe(false)
    })

    it('isSessionActive returns false for finished', () => {
      const state: SessionState = { ...createInitialState(), status: SessionStatus.Finished }
      expect(isSessionActive(state)).toBe(false)
    })

    it('isSessionRunning returns true only for running', () => {
      expect(isSessionRunning({ ...createInitialState(), status: SessionStatus.Running })).toBe(true)
      expect(isSessionRunning({ ...createInitialState(), status: SessionStatus.Paused })).toBe(false)
      expect(isSessionRunning({ ...createInitialState(), status: SessionStatus.Idle })).toBe(false)
    })

    it('isSessionPaused returns true only for paused', () => {
      expect(isSessionPaused({ ...createInitialState(), status: SessionStatus.Paused })).toBe(true)
      expect(isSessionPaused({ ...createInitialState(), status: SessionStatus.Running })).toBe(false)
    })

    it('isSessionFinished returns true only for finished', () => {
      expect(isSessionFinished({ ...createInitialState(), status: SessionStatus.Finished })).toBe(true)
      expect(isSessionFinished({ ...createInitialState(), status: SessionStatus.Running })).toBe(false)
    })

    it('isSessionIdle returns true only for idle', () => {
      expect(isSessionIdle(createInitialState())).toBe(true)
      expect(isSessionIdle({ ...createInitialState(), status: SessionStatus.Running })).toBe(false)
    })
  })

  describe('getCurrentPhase', () => {
    it('returns null when mode is null', () => {
      const state = createInitialState()
      expect(getCurrentPhase(state)).toBeNull()
    })

    it('returns current phase from mode', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 0,
      }
      const phase = getCurrentPhase(state)
      expect(phase).not.toBeNull()
      expect(phase?.type).toBe(PhaseType.Prep)
    })

    it('returns second phase when index is 1', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 1,
      }
      const phase = getCurrentPhase(state)
      expect(phase?.type).toBe(PhaseType.SlotA)
    })

    it('returns null for out of bounds index', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 999,
      }
      expect(getCurrentPhase(state)).toBeNull()
    })
  })

  describe('isLastPhase', () => {
    it('returns false when not at last phase', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 0,
      }
      expect(isLastPhase(state)).toBe(false)
    })

    it('returns true when at last phase', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: MAINTAIN_MODE.phases.length - 1,
      }
      expect(isLastPhase(state)).toBe(true)
    })

    it('returns false when mode is null', () => {
      const state = createInitialState()
      expect(isLastPhase(state)).toBe(false)
    })
  })

  describe('getPhaseProgress', () => {
    it('returns 0 when no phase', () => {
      const state = createInitialState()
      expect(getPhaseProgress(state)).toBe(0)
    })

    it('returns 0 at phase start', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 0,
        remainingTime: MAINTAIN_MODE.phases[0].duration, // full duration remaining
      }
      expect(getPhaseProgress(state)).toBe(0)
    })

    it('returns 0.5 at halfway point', () => {
      const phaseDuration = MAINTAIN_MODE.phases[0].duration
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 0,
        remainingTime: phaseDuration / 2,
      }
      expect(getPhaseProgress(state)).toBe(0.5)
    })

    it('returns 1 when phase complete', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 0,
        remainingTime: 0,
      }
      expect(getPhaseProgress(state)).toBe(1)
    })
  })

  describe('getSessionProgress', () => {
    it('returns 0 when no mode', () => {
      const state = createInitialState()
      expect(getSessionProgress(state)).toBe(0)
    })

    it('returns 0 at session start', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        elapsedSessionTime: 0,
      }
      expect(getSessionProgress(state)).toBe(0)
    })

    it('returns progress based on elapsed time', () => {
      const totalDuration = MAINTAIN_MODE.phases.reduce((sum, p) => sum + p.duration, 0)
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        elapsedSessionTime: totalDuration / 2,
      }
      expect(getSessionProgress(state)).toBeCloseTo(0.5, 2)
    })
  })

  describe('getRemainingPhaseCount', () => {
    it('returns 0 when no mode', () => {
      const state = createInitialState()
      expect(getRemainingPhaseCount(state)).toBe(0)
    })

    it('returns total phases at start', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: 0,
      }
      expect(getRemainingPhaseCount(state)).toBe(MAINTAIN_MODE.phases.length)
    })

    it('returns 1 at last phase', () => {
      const state: SessionState = {
        ...createInitialState(),
        mode: MAINTAIN_MODE,
        currentPhaseIndex: MAINTAIN_MODE.phases.length - 1,
      }
      expect(getRemainingPhaseCount(state)).toBe(1)
    })
  })
})

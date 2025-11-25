import { describe, it, expect } from 'vitest'
import {
  createSessionViewModel,
  createIdleViewModel,
  getStatusI18nKey,
  getPhaseI18nKey,
  getSpeakerI18nKey,
} from '../SessionViewModel'
import { SessionState, SessionStatus, createInitialState } from '../../domain/SessionState'
import { MAINTAIN_MODE } from '../../domain/SessionMode.presets'
import { PhaseType } from '../../domain/PhaseType'
import { Speaker } from '../../domain/Speaker'

describe('SessionViewModel', () => {
  describe('createSessionViewModel', () => {
    describe('Status flags', () => {
      it('sets correct flags for idle state', () => {
        const state = createInitialState()
        const vm = createSessionViewModel(state)

        expect(vm.isIdle).toBe(true)
        expect(vm.isRunning).toBe(false)
        expect(vm.isPaused).toBe(false)
        expect(vm.isFinished).toBe(false)
      })

      it('sets correct flags for running state', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          remainingTime: 300,
        }
        const vm = createSessionViewModel(state)

        expect(vm.isIdle).toBe(false)
        expect(vm.isRunning).toBe(true)
        expect(vm.isPaused).toBe(false)
        expect(vm.isFinished).toBe(false)
      })

      it('sets correct flags for paused state', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Paused,
          mode: MAINTAIN_MODE,
          remainingTime: 300,
          pausedAt: Date.now(),
        }
        const vm = createSessionViewModel(state)

        expect(vm.isIdle).toBe(false)
        expect(vm.isRunning).toBe(false)
        expect(vm.isPaused).toBe(true)
        expect(vm.isFinished).toBe(false)
      })

      it('sets correct flags for finished state', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Finished,
          mode: MAINTAIN_MODE,
          remainingTime: 0,
        }
        const vm = createSessionViewModel(state)

        expect(vm.isIdle).toBe(false)
        expect(vm.isRunning).toBe(false)
        expect(vm.isPaused).toBe(false)
        expect(vm.isFinished).toBe(true)
      })
    })

    describe('Time display', () => {
      it('formats remaining time correctly', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          remainingTime: 125, // 2:05
        }
        const vm = createSessionViewModel(state)

        expect(vm.remainingTimeFormatted).toBe('2:05')
        expect(vm.remainingSeconds).toBe(125)
      })

      it('formats elapsed time correctly', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          elapsedSessionTime: 3661, // 1:01:01
          remainingTime: 300,
        }
        const vm = createSessionViewModel(state)

        expect(vm.elapsedTimeFormatted).toBe('1:01:01')
        expect(vm.elapsedSeconds).toBe(3661)
      })

      it('handles zero time', () => {
        const state = createInitialState()
        const vm = createSessionViewModel(state)

        expect(vm.remainingTimeFormatted).toBe('0:00')
        expect(vm.elapsedTimeFormatted).toBe('0:00')
      })
    })

    describe('Phase info', () => {
      it('provides phase index and total', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          currentPhaseIndex: 2,
          remainingTime: 300,
        }
        const vm = createSessionViewModel(state)

        expect(vm.currentPhaseIndex).toBe(2)
        expect(vm.totalPhases).toBe(MAINTAIN_MODE.phases.length)
      })

      it('provides phase type and display name', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          currentPhaseIndex: 0, // First phase is Prep
          remainingTime: 120,
        }
        const vm = createSessionViewModel(state)

        expect(vm.phaseType).toBe(PhaseType.Prep)
        expect(vm.phaseDisplayName).toBeTruthy()
      })

      it('provides null phase for idle state', () => {
        const state = createInitialState()
        const vm = createSessionViewModel(state)

        expect(vm.phaseType).toBeNull()
        expect(vm.phaseDisplayName).toBe('')
      })
    })

    describe('Speaker info', () => {
      it('identifies speaker A phases', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          currentPhaseIndex: 1, // SlotA
          remainingTime: 300,
        }
        const vm = createSessionViewModel(state)

        expect(vm.speaker).toBe(Speaker.A)
        expect(vm.isSpeakerA).toBe(true)
        expect(vm.isSpeakerB).toBe(false)
      })

      it('identifies speaker B phases', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          currentPhaseIndex: 2, // SlotB
          remainingTime: 300,
        }
        const vm = createSessionViewModel(state)

        expect(vm.speaker).toBe(Speaker.B)
        expect(vm.isSpeakerA).toBe(false)
        expect(vm.isSpeakerB).toBe(true)
      })

      it('identifies non-speaking phases', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          currentPhaseIndex: 0, // Prep
          remainingTime: 120,
        }
        const vm = createSessionViewModel(state)

        expect(vm.speaker).toBe(Speaker.None)
        expect(vm.isSpeakerA).toBe(false)
        expect(vm.isSpeakerB).toBe(false)
      })
    })

    describe('Progress', () => {
      it('calculates phase progress', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          currentPhaseIndex: 0, // Prep (120s)
          remainingTime: 60, // Half done
        }
        const vm = createSessionViewModel(state)

        expect(vm.phaseProgress).toBe(0.5)
        expect(vm.phaseProgressPercent).toBe(50)
      })

      it('calculates session progress', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          currentPhaseIndex: 0,
          remainingTime: 120,
          elapsedSessionTime: 0,
        }
        const vm = createSessionViewModel(state)

        expect(vm.sessionProgress).toBeGreaterThanOrEqual(0)
        expect(vm.sessionProgress).toBeLessThanOrEqual(1)
      })
    })

    describe('Mode info', () => {
      it('provides mode name and id when available', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          remainingTime: 300,
        }
        const vm = createSessionViewModel(state)

        expect(vm.modeName).toBe(MAINTAIN_MODE.name)
        expect(vm.modeId).toBe(MAINTAIN_MODE.id)
      })

      it('returns null mode info when idle', () => {
        const state = createInitialState()
        const vm = createSessionViewModel(state)

        expect(vm.modeName).toBeNull()
        expect(vm.modeId).toBeNull()
      })
    })

    describe('Action availability', () => {
      it('can start when idle', () => {
        const state = createInitialState()
        const vm = createSessionViewModel(state)

        expect(vm.canStart).toBe(true)
        expect(vm.canPause).toBe(false)
        expect(vm.canResume).toBe(false)
        expect(vm.canStop).toBe(false)
      })

      it('can pause and stop when running', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Running,
          mode: MAINTAIN_MODE,
          remainingTime: 300,
        }
        const vm = createSessionViewModel(state)

        expect(vm.canStart).toBe(false)
        expect(vm.canPause).toBe(true)
        expect(vm.canResume).toBe(false)
        expect(vm.canStop).toBe(true)
      })

      it('can resume and stop when paused', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Paused,
          mode: MAINTAIN_MODE,
          remainingTime: 300,
          pausedAt: Date.now(),
        }
        const vm = createSessionViewModel(state)

        expect(vm.canStart).toBe(false)
        expect(vm.canPause).toBe(false)
        expect(vm.canResume).toBe(true)
        expect(vm.canStop).toBe(true)
      })

      it('can start when finished', () => {
        const state: SessionState = {
          ...createInitialState(),
          status: SessionStatus.Finished,
          mode: MAINTAIN_MODE,
          remainingTime: 0,
        }
        const vm = createSessionViewModel(state)

        expect(vm.canStart).toBe(true)
        expect(vm.canPause).toBe(false)
        expect(vm.canResume).toBe(false)
        expect(vm.canStop).toBe(false)
      })
    })
  })

  describe('createIdleViewModel', () => {
    it('returns a valid idle view model', () => {
      const vm = createIdleViewModel()

      expect(vm.isIdle).toBe(true)
      expect(vm.canStart).toBe(true)
      expect(vm.remainingTimeFormatted).toBe('0:00')
      expect(vm.phaseType).toBeNull()
    })
  })

  describe('i18n key helpers', () => {
    it('getStatusI18nKey returns correct keys', () => {
      expect(getStatusI18nKey(SessionStatus.Idle)).toBe('session.status.idle')
      expect(getStatusI18nKey(SessionStatus.Running)).toBe('session.status.running')
      expect(getStatusI18nKey(SessionStatus.Paused)).toBe('session.status.paused')
      expect(getStatusI18nKey(SessionStatus.Finished)).toBe('session.status.finished')
    })

    it('getPhaseI18nKey returns correct keys', () => {
      expect(getPhaseI18nKey(PhaseType.Prep)).toBe('phases.prep')
      expect(getPhaseI18nKey(PhaseType.SlotA)).toBe('phases.slotA')
      expect(getPhaseI18nKey(PhaseType.SlotB)).toBe('phases.slotB')
      expect(getPhaseI18nKey(PhaseType.Transition)).toBe('phases.transition')
      expect(getPhaseI18nKey(PhaseType.Cooldown)).toBe('phases.cooldown')
    })

    it('getSpeakerI18nKey returns correct keys', () => {
      expect(getSpeakerI18nKey(Speaker.A)).toBe('speaker.a')
      expect(getSpeakerI18nKey(Speaker.B)).toBe('speaker.b')
      expect(getSpeakerI18nKey(Speaker.None)).toBe('speaker.none')
    })
  })
})

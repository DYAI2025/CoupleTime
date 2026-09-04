import { describe, it, expect } from 'vitest'
import { createSessionViewModel } from '../SessionViewModel'
import { SessionState, SessionStatus, createInitialState } from '../../domain/SessionState'
import { COUPLECARE_MODE, MAINTAIN_MODE } from '../../domain/SessionMode.presets'

describe('SessionViewModel - CoupleCare guidance visibility', () => {
  it('shows guidance tips during couplecare slotA', () => {
    const state: SessionState = {
      ...createInitialState(),
      status: SessionStatus.Running,
      mode: COUPLECARE_MODE,
      currentPhaseIndex: 1,
      remainingTime: 600,
    }
    const vm = createSessionViewModel(state)
    expect(vm.showGuidanceTips).toBe(true)
  })

  it('shows guidance tips during couplecare slotB', () => {
    const state: SessionState = {
      ...createInitialState(),
      status: SessionStatus.Running,
      mode: COUPLECARE_MODE,
      currentPhaseIndex: 2,
      remainingTime: 600,
    }
    const vm = createSessionViewModel(state)
    expect(vm.showGuidanceTips).toBe(true)
  })

  it('hides guidance tips during maintain slotA', () => {
    const state: SessionState = {
      ...createInitialState(),
      status: SessionStatus.Running,
      mode: MAINTAIN_MODE,
      currentPhaseIndex: 1,
      remainingTime: 900,
    }
    const vm = createSessionViewModel(state)
    expect(vm.showGuidanceTips).toBe(false)
  })
})

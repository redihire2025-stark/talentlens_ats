import { beforeEach, describe, expect, it } from 'vitest'
import { useMatchStore } from './matchStore'
import { buildTestResume, buildTestJobDescription } from '@/lib/matching/testFixtures'

describe('useMatchStore', () => {
  beforeEach(() => {
    useMatchStore.getState().reset()
  })

  it('starts idle with no result', () => {
    expect(useMatchStore.getState().result).toBeNull()
    expect(useMatchStore.getState().status).toBe('idle')
  })

  it('match() populates the analysis and result on success', async () => {
    await useMatchStore.getState().match(buildTestResume(), buildTestJobDescription(), 85)
    const state = useMatchStore.getState()
    expect(state.status).toBe('ready')
    expect(state.result?.breakdown.atsCompatibility).toBe(85)
    expect(state.analysis?.skills.required.length).toBeGreaterThan(0)
  })
})

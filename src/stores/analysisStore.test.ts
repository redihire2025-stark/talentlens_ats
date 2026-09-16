import { beforeEach, describe, expect, it } from 'vitest'
import { useAnalysisStore } from './analysisStore'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('useAnalysisStore', () => {
  beforeEach(() => {
    useAnalysisStore.getState().reset()
  })

  it('starts idle with no result', () => {
    expect(useAnalysisStore.getState().atsResult).toBeNull()
    expect(useAnalysisStore.getState().status).toBe('idle')
  })

  it('analyze() populates the ATS result on success', async () => {
    await useAnalysisStore.getState().analyze(buildTestResume(), [])
    const state = useAnalysisStore.getState()
    expect(state.status).toBe('ready')
    expect(state.atsResult?.score).toBeGreaterThan(0)
  })
})

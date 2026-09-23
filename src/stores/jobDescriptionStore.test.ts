import { beforeEach, describe, expect, it } from 'vitest'
import { useJobDescriptionStore } from './jobDescriptionStore'

describe('useJobDescriptionStore', () => {
  beforeEach(() => {
    useJobDescriptionStore.getState().reset()
  })

  it('starts idle with no jobDescription', () => {
    expect(useJobDescriptionStore.getState().jobDescription).toBeNull()
    expect(useJobDescriptionStore.getState().status).toBe('idle')
  })

  it('parseText() populates the job description on success', async () => {
    useJobDescriptionStore.getState().setText('Senior Engineer\n\nRequirements\nReact, TypeScript')
    await useJobDescriptionStore.getState().parseText()
    const state = useJobDescriptionStore.getState()
    expect(state.status).toBe('ready')
    expect(state.jobDescription?.requiredSkills.map((r) => r.rawText)).toEqual(['React', 'TypeScript'])
  })

  it('parseText() is a no-op for blank text', async () => {
    useJobDescriptionStore.getState().setText('   ')
    await useJobDescriptionStore.getState().parseText()
    expect(useJobDescriptionStore.getState().status).toBe('idle')
  })

  it('setText() clears a previous parse result', async () => {
    useJobDescriptionStore.getState().setText('Senior Engineer\n\nRequirements\nReact')
    await useJobDescriptionStore.getState().parseText()
    useJobDescriptionStore.getState().setText('Something else')
    expect(useJobDescriptionStore.getState().jobDescription).toBeNull()
  })
})

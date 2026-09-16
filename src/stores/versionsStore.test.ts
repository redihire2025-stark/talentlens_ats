import { beforeEach, describe, expect, it } from 'vitest'
import { useVersionsStore } from './versionsStore'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('useVersionsStore', () => {
  beforeEach(() => {
    useVersionsStore.getState().reset()
  })

  it('initOriginal() creates the Original version once', () => {
    const resume = buildTestResume()
    useVersionsStore.getState().initOriginal(resume, 85)
    useVersionsStore.getState().initOriginal(buildTestResume({ summary: 'different' }), 50)

    const state = useVersionsStore.getState()
    expect(state.versions).toHaveLength(1)
    expect(state.versions[0]!.id).toBe('original')
    expect(state.versions[0]!.parentVersionId).toBeNull()
    expect(state.versions[0]!.resume).toEqual(resume)
  })

  it('saveVersion() parents a new version to the currently active one and records the diff', () => {
    const original = buildTestResume()
    useVersionsStore.getState().initOriginal(original, 85)

    const edited = buildTestResume({ summary: 'A new summary.' })
    const version = useVersionsStore.getState().saveVersion('Version 1', edited, 88, null)

    expect(version.parentVersionId).toBe('original')
    expect(version.changes).toContain('Summary updated.')
    expect(useVersionsStore.getState().activeVersionId).toBe(version.id)
  })

  it('never mutates or removes the original version when saving new ones', () => {
    const original = buildTestResume()
    useVersionsStore.getState().initOriginal(original, 85)
    useVersionsStore.getState().saveVersion('Version 1', buildTestResume({ summary: 'x' }), 88, null)

    const state = useVersionsStore.getState()
    expect(state.versions.find((v) => v.id === 'original')!.resume).toEqual(original)
    expect(state.versions).toHaveLength(2)
  })

  it('selectVersion() returns that version\'s resume and marks it active', () => {
    useVersionsStore.getState().initOriginal(buildTestResume(), 85)
    const v1 = useVersionsStore.getState().saveVersion('Version 1', buildTestResume({ summary: 'x' }), 88, null)

    useVersionsStore.getState().selectVersion('original')
    expect(useVersionsStore.getState().activeVersionId).toBe('original')

    const resume = useVersionsStore.getState().selectVersion(v1.id)
    expect(resume).toEqual(v1.resume)
  })

  it('selectVersion() returns null for an unknown id without throwing', () => {
    expect(useVersionsStore.getState().selectVersion('nope')).toBeNull()
  })
})

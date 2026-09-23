import { describe, expect, it } from 'vitest'
import { createResumeVersion } from './resumeVersions'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('createResumeVersion', () => {
  it('creates an "original" version with no parent and no changes', async () => {
    const resume = buildTestResume()
    const result = await createResumeVersion({
      label: 'Original',
      resume,
      parentVersion: null,
      scoreSnapshot: { ats: 80, jdMatch: null },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.version.id).toBe('original')
    expect(result.data.version.parentVersionId).toBeNull()
    expect(result.data.version.changes).toEqual([])
  })

  it('creates a child version with a human-readable diff against its parent', async () => {
    const original = buildTestResume()
    const originalResult = await createResumeVersion({ label: 'Original', resume: original, parentVersion: null, scoreSnapshot: { ats: 70, jdMatch: null } })
    if (!originalResult.ok) throw new Error('setup failed')

    const edited = { ...original, summary: 'A rewritten summary.' }
    const result = await createResumeVersion({
      label: 'Tailored for Acme',
      resume: edited,
      parentVersion: originalResult.data.version,
      scoreSnapshot: { ats: 85, jdMatch: 72 },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.version.parentVersionId).toBe('original')
    expect(result.data.version.changes.length).toBeGreaterThan(0)
  })

  it('rejects a request missing a label', async () => {
    // @ts-expect-error intentionally invalid request
    const result = await createResumeVersion({ resume: buildTestResume(), parentVersion: null, scoreSnapshot: { ats: 80, jdMatch: null } })
    expect(result.ok).toBe(false)
  })
})

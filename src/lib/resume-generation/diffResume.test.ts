import { describe, expect, it } from 'vitest'
import { diffResumeChanges } from './diffResume'
import { buildTestResume } from '@/lib/ats/testFixtures'
import { buildResumeSkills } from '@/lib/schema/resumeBuilders'
import { replaceExperienceBullet } from './applyEdits'

describe('diffResumeChanges', () => {
  it('returns no changes for an identical resume', () => {
    const resume = buildTestResume()
    expect(diffResumeChanges(resume, resume)).toEqual([])
  })

  it('detects a summary change', () => {
    const before = buildTestResume()
    const after = buildTestResume({ summary: 'New summary.' })
    expect(diffResumeChanges(before, after)).toContain('Summary updated.')
  })

  it('detects a skills change', () => {
    const before = buildTestResume()
    const after = buildTestResume({ skills: buildResumeSkills([{ rawName: 'Docker', category: 'tool' }]) })
    expect(diffResumeChanges(before, after)).toContain('Skills updated.')
  })

  it('detects a bullet change under the correct entry', () => {
    const before = buildTestResume()
    const after = replaceExperienceBullet(before, 0, 0, 'A rewritten bullet.')
    expect(diffResumeChanges(before, after)[0]).toContain('Acme Corp')
  })
})

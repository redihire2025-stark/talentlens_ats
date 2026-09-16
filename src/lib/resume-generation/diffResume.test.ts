import { describe, expect, it } from 'vitest'
import { diffResumeChanges } from './diffResume'
import { buildTestResume } from '@/lib/ats/testFixtures'

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
    const after = buildTestResume({ skills: [{ name: 'Docker', category: 'tool', evidence: [] }] })
    expect(diffResumeChanges(before, after)).toContain('Skills updated.')
  })

  it('detects a bullet change under the correct entry', () => {
    const before = buildTestResume()
    const after = buildTestResume({
      experience: before.experience.map((entry, i) =>
        i === 0 ? { ...entry, bullets: ['A rewritten bullet.', entry.bullets[1]!] } : entry,
      ),
    })
    expect(diffResumeChanges(before, after)[0]).toContain('Acme Corp')
  })
})

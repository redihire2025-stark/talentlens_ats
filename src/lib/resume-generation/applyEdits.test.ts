import { describe, expect, it } from 'vitest'
import { replaceExperienceBullet, updateExperienceField, updateSkillNames, updateSummary } from './applyEdits'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('replaceExperienceBullet', () => {
  it('replaces the bullet at the given position without mutating the original', () => {
    const original = buildTestResume()
    const updated = replaceExperienceBullet(original, 0, 0, 'Rewrote this bullet.')
    expect(updated.experience[0]!.bullets[0]).toBe('Rewrote this bullet.')
    expect(original.experience[0]!.bullets[0]).not.toBe('Rewrote this bullet.')
  })

  it('leaves other bullets in the same entry untouched', () => {
    const updated = replaceExperienceBullet(buildTestResume(), 0, 0, 'New text.')
    expect(updated.experience[0]!.bullets[1]).toBe(buildTestResume().experience[0]!.bullets[1])
  })

  it('returns the resume unchanged for an out-of-range index rather than throwing', () => {
    const original = buildTestResume()
    expect(replaceExperienceBullet(original, 5, 0, 'x')).toBe(original)
    expect(replaceExperienceBullet(original, 0, 99, 'x')).toBe(original)
  })
})

describe('updateSummary', () => {
  it('sets the summary', () => {
    expect(updateSummary(buildTestResume(), 'New summary.').summary).toBe('New summary.')
  })

  it('treats a blank summary as null rather than an empty string', () => {
    expect(updateSummary(buildTestResume(), '   ').summary).toBeNull()
  })
})

describe('updateSkillNames', () => {
  it('preserves category/evidence for an unchanged skill name', () => {
    const resume = buildTestResume()
    const updated = updateSkillNames(resume, ['React', 'TypeScript'])
    expect(updated.skills[0]).toEqual(resume.skills[0])
  })

  it('adds a new skill with a default category and no evidence', () => {
    const updated = updateSkillNames(buildTestResume(), ['React', 'TypeScript', 'Docker'])
    const docker = updated.skills.find((s) => s.name === 'Docker')
    expect(docker).toEqual({ name: 'Docker', category: 'other', evidence: [] })
  })

  it('drops a skill removed from the list', () => {
    const updated = updateSkillNames(buildTestResume(), ['React'])
    expect(updated.skills).toHaveLength(1)
  })
})

describe('updateExperienceField', () => {
  it('updates the title of the given entry only', () => {
    const updated = updateExperienceField(buildTestResume(), 0, 'title', 'Staff Engineer')
    expect(updated.experience[0]!.title).toBe('Staff Engineer')
  })
})

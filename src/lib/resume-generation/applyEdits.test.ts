import { describe, expect, it } from 'vitest'
import { applyRecommendationAcceptance, replaceExperienceBullet, updateExperienceField, updateSkillNames, updateSummary } from './applyEdits'
import { explicitEvidence } from '@/lib/schema/evidence'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'
import { normalizeTitle } from '@/lib/normalization/normalizeTitle'
import { generateRecommendations } from '@/lib/recommendations/generateRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('replaceExperienceBullet', () => {
  it('replaces the bullet at the given position without mutating the original', () => {
    const original = buildTestResume()
    const updated = replaceExperienceBullet(original, 0, 0, 'Rewrote this bullet.')
    expect(updated.experience[0]!.bullets[0]!.text).toBe('Rewrote this bullet.')
    expect(original.experience[0]!.bullets[0]!.text).not.toBe('Rewrote this bullet.')
  })

  it('leaves other bullets in the same entry untouched', () => {
    const updated = replaceExperienceBullet(buildTestResume(), 0, 0, 'New text.')
    expect(updated.experience[0]!.bullets[1]).toEqual(buildTestResume().experience[0]!.bullets[1])
  })

  it('rebuilds the edited bullet entity (same id, freshly derived fields) and re-links skill evidence', () => {
    const original = buildTestResume()
    const updated = replaceExperienceBullet(original, 0, 1, 'Cut build time by 50% with Docker and TypeScript.')
    const bullet = updated.experience[0]!.bullets[1]!
    expect(bullet.id).toBe('exp-0-bullet-1')
    expect(bullet.actionVerb).toBeUndefined()
    expect(bullet.metrics).toEqual([{ text: '50%', value: 50, kind: 'percentage' }])
    expect(bullet.technologies.map((t) => t.canonicalName)).toEqual(['typescript', 'docker'])
    expect(bullet.achievements).toEqual(['Cut build time by 50% with Docker and TypeScript.'])
    expect(updated.experience[0]!.technologies).toEqual(['react', 'typescript', 'docker'])

    // TypeScript was listed-only before; the edited bullet now demonstrates it.
    expect(original.skills[1]!.sources).toEqual(['skills-section'])
    expect(updated.skills[1]!.sources).toEqual(['skills-section', 'experience'])
    expect(updated.skills[1]!.evidence[1]).toEqual(explicitEvidence('Cut build time by 50% with Docker and TypeScript.', 'experience', 'exp-0'))
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

  it('adds a new skill with a default category, a positional id, and the typed name as its only evidence', () => {
    const updated = updateSkillNames(buildTestResume(), ['React', 'TypeScript', 'Docker'])
    const docker = updated.skills.find((s) => s.rawName === 'Docker')
    expect(docker).toEqual({
      id: 'skill-2',
      rawName: 'Docker',
      canonicalName: 'docker',
      category: 'other',
      aliases: [],
      evidence: [explicitEvidence('Docker', 'skills', 'skill-2')],
      confidence: 1,
      sources: ['skills-section'],
    })
  })

  it('drops a skill removed from the list', () => {
    const updated = updateSkillNames(buildTestResume(), ['React'])
    expect(updated.skills).toHaveLength(1)
  })

  it('re-assigns positional ids after a reorder so ids stay unique', () => {
    const updated = updateSkillNames(buildTestResume(), ['TypeScript', 'Go', 'React'])
    expect(updated.skills.map((s) => [s.id, s.rawName])).toEqual([
      ['skill-0', 'TypeScript'],
      ['skill-1', 'Go'],
      ['skill-2', 'React'],
    ])
    expect(updated.skills[0]!.evidence[0]!.entryId).toBe('skill-0')
  })
})

describe('updateExperienceField', () => {
  it('updates the title of the given entry only', () => {
    const updated = updateExperienceField(buildTestResume(), 0, 'title', 'Staff Engineer')
    expect(updated.experience[0]!.title).toBe('Staff Engineer')
  })

  it('rebuilds the derived title fields and meta evidence', () => {
    const updated = updateExperienceField(buildTestResume(), 0, 'title', 'Sr. Front-End Developer Intern')
    expect(updated.experience[0]!.normalizedJobTitle).toBe(normalizeTitle('Sr. Front-End Developer Intern').coreTitle)
    expect(updated.experience[0]!.experienceType).toBe('internship')
    expect(updated.experience[0]!.evidence).toEqual([explicitEvidence('Sr. Front-End Developer Intern, Acme Corp', 'experience', 'exp-0')])
    expect(updated.experience[0]!.id).toBe('exp-0')
  })
})

describe('applyRecommendationAcceptance', () => {
  it('applies the text at the bullet the recommendation points at by id, even if positions shifted', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'A', title: 'Eng', startDate: null, endDate: null, location: null, bullets: ['First.', 'Worked on stuff.'] },
      ]),
    })
    const [rec] = generateRecommendations({ resume, parserWarnings: [] }).filter((r) => r.currentText === 'Worked on stuff.')
    // Stale positional index, correct ids:
    const stale = { ...rec!, location: { ...rec!.location!, bulletIndex: 0 } }
    const { resume: next, status } = applyRecommendationAcceptance(resume, stale, 'Shipped the checkout redesign.')
    expect(status).toBe('edited')
    expect(next.experience[0]!.bullets.map((b) => b.text)).toEqual(['First.', 'Shipped the checkout redesign.'])
  })
})

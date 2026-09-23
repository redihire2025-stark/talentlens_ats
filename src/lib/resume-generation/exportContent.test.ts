import { describe, expect, it } from 'vitest'
import { buildExportContent } from './exportContent'
import { buildTestResume } from '@/lib/ats/testFixtures'
import { buildResumeSkills } from '@/lib/schema/resumeBuilders'

describe('buildExportContent', () => {
  it('renders experience bullets from ExperienceBullet.text — plain strings, never the entity', () => {
    const content = buildExportContent(buildTestResume())
    expect(content.experience[0]!.bullets).toEqual([
      'Built reusable React components used across 4 production applications.',
      'Reduced page load time by 35% through code splitting.',
    ])
    expect(JSON.stringify(content)).not.toContain('[object Object]')
  })

  it('exports skills exactly as written (rawName), not their canonical form', () => {
    const content = buildExportContent(buildTestResume({ skills: buildResumeSkills([{ rawName: 'React.js' }, { rawName: 'Postgres' }]) }))
    expect(content.skillsLine).toBe('React.js, Postgres')
  })

  it('reads contact info from resume.contact', () => {
    const content = buildExportContent(buildTestResume())
    expect(content.name).toBe('Jordan Rivera')
    expect(content.contactLine).toBe('jordan@example.com | 555-010-1234 | Austin, TX')
  })
})

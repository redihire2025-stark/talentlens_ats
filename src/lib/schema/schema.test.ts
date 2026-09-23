import { describe, expect, it } from 'vitest'
import { hashText } from './ids'
import { extractMetrics } from './metrics'
import { explicitEvidence, structuralEvidence, dedupeEvidence } from './evidence'
import {
  buildExperienceBullet,
  buildExperienceEntry,
  buildResumeSkill,
  buildProjectEntry,
  detectExperienceType,
  emptyResume,
  linkSkillEvidence,
  rebuildExperienceEntry,
  reindexSkills,
} from './resumeBuilders'

describe('hashText', () => {
  it('is deterministic and content-sensitive', () => {
    expect(hashText('hello')).toBe(hashText('hello'))
    expect(hashText('hello')).not.toBe(hashText('hello!'))
    expect(hashText('')).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('evidence helpers', () => {
  it('builds explicit vs structural evidence and omits entryId when not given', () => {
    expect(explicitEvidence('Built X', 'experience', 'exp-0')).toEqual({
      text: 'Built X',
      section: 'experience',
      entryId: 'exp-0',
      sourceType: 'explicit',
      confidence: 1,
    })
    expect(structuralEvidence('2 entries detected', 'experience')).toEqual({
      text: '2 entries detected',
      section: 'experience',
      sourceType: 'inferred-from-structure',
      confidence: 1,
    })
  })

  it('dedupes identical quotes from the same place', () => {
    const e = explicitEvidence('a', 'skills', 'skill-0')
    expect(dedupeEvidence([e, { ...e }, explicitEvidence('a', 'experience', 'exp-0')])).toHaveLength(2)
  })
})

describe('extractMetrics', () => {
  it('extracts each number-bearing phrase verbatim, with a kind', () => {
    expect(extractMetrics('Reduced page load time by 35% and saved $1.2M across 4 teams in 3 months, a 2x speedup.')).toEqual([
      { text: '35%', value: 35, kind: 'percentage' },
      { text: '$1.2M', value: 1.2, kind: 'currency' },
      { text: '4', value: 4, kind: 'count' },
      { text: '3 months', value: 3, kind: 'duration' },
      { text: '2x', value: 2, kind: 'multiplier' },
    ])
  })

  it('does not treat a bare year as a metric, and returns nothing for a number-free bullet', () => {
    expect(extractMetrics('Maintained the platform since 2019.')).toEqual([])
    expect(extractMetrics('Built React applications.')).toEqual([])
  })

  it('handles thousands separators', () => {
    expect(extractMetrics('Served 10,000+ users')).toEqual([{ text: '10,000+', value: 10000, kind: 'count' }])
  })
})

describe('buildExperienceBullet', () => {
  it('derives every sub-field from the text alone', () => {
    const bullet = buildExperienceBullet('Reduced page load time by 35% using React.js code splitting.', 'exp-1', 2)
    expect(bullet.id).toBe('exp-1-bullet-2')
    expect(bullet.actionVerb).toBe('reduced')
    expect(bullet.metrics).toEqual([{ text: '35%', value: 35, kind: 'percentage' }])
    expect(bullet.technologies.map((t) => [t.id, t.rawName, t.canonicalName])).toEqual([['exp-1-bullet-2-tech-0', 'React.js', 'react']])
    expect(bullet.achievements).toEqual(['Reduced page load time by 35% using React.js code splitting.'])
    expect(bullet.responsibilities).toEqual([])
    expect(bullet.evidence).toEqual([explicitEvidence('Reduced page load time by 35% using React.js code splitting.', 'experience', 'exp-1')])
  })

  it('keeps the text verbatim (e.g. a trailing space while typing in the editor) but analyzes the trimmed form', () => {
    const bullet = buildExperienceBullet('Built Docker images ', 'exp-0', 0)
    expect(bullet.text).toBe('Built Docker images ')
    expect(bullet.evidence[0]!.text).toBe('Built Docker images')
    expect(bullet.technologies.map((t) => t.canonicalName)).toEqual(['docker'])
  })

  it('states a duty bullet as a responsibility with the weak lead-in stripped, and has no actionVerb', () => {
    const bullet = buildExperienceBullet('Responsible for managing the design system', 'exp-0', 0)
    expect(bullet).not.toHaveProperty('actionVerb')
    expect(bullet.responsibilities).toEqual(['managing the design system'])
    expect(bullet.achievements).toEqual([])
    expect(bullet.metrics).toEqual([])
  })
})

describe('buildExperienceEntry', () => {
  it('aggregates technologies, normalizes the title, and only marks isCurrent when told', () => {
    const entry = buildExperienceEntry(
      {
        company: 'Acme',
        title: 'Sr. Front-End Developer',
        startDate: '2020-01-01',
        endDate: null,
        location: null,
        bullets: ['Built React apps on AWS', 'Migrated services to Docker and AWS'],
        metaLines: ['Sr. Front-End Developer | Acme | 2020 - Present'],
        isCurrent: true,
      },
      3,
    )
    expect(entry.id).toBe('exp-3')
    expect(entry.normalizedJobTitle).toBe('frontend engineer')
    expect(entry.technologies).toEqual(['react', 'aws', 'docker'])
    expect(entry.isCurrent).toBe(true)
    expect(entry.evidence).toEqual([explicitEvidence('Sr. Front-End Developer | Acme | 2020 - Present', 'experience', 'exp-3')])
  })

  it('detects an employment type only from what the text states', () => {
    expect(detectExperienceType('Software Engineering Intern, Acme')).toBe('internship')
    expect(detectExperienceType('Contract Developer | Beta')).toBe('contract')
    expect(detectExperienceType('Engineer, Acme')).toBe('unspecified')
  })

  it('rebuilds derived fields after an edit, keeping the id', () => {
    const entry = buildExperienceEntry(
      { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Worked on things'] },
      0,
    )
    const rebuilt = rebuildExperienceEntry(entry, { bullets: ['Built Docker images'] }, 0)
    expect(rebuilt.id).toBe('exp-0')
    expect(rebuilt.bullets[0]!.technologies.map((t) => t.canonicalName)).toEqual(['docker'])
    expect(rebuilt.technologies).toEqual(['docker'])
  })
})

describe('skill linking', () => {
  it('links listed skills to the bullets that mention them, and recomputes after edits', () => {
    const base = emptyResume({
      skills: [buildResumeSkill({ rawName: 'Docker', sourceLine: 'Tools: Docker, Git' }, 0), buildResumeSkill({ rawName: 'Git' }, 1)],
      experience: [
        buildExperienceEntry({ company: 'A', title: 'Eng', startDate: null, endDate: null, location: null, bullets: ['Containerized apps with Docker'] }, 0),
      ],
    })
    const linked = linkSkillEvidence(base)
    expect(linked.skills[0]!.sources).toEqual(['skills-section', 'experience'])
    expect(linked.skills[0]!.evidence.map((e) => e.section)).toEqual(['skills', 'experience'])
    expect(linked.skills[1]!.sources).toEqual(['skills-section'])

    const edited = linkSkillEvidence({ ...linked, experience: [rebuildExperienceEntry(linked.experience[0]!, { bullets: ['Wrote docs'] }, 0)] })
    expect(edited.skills[0]!.sources).toEqual(['skills-section'])
    expect(edited.skills[0]!.evidence).toEqual([explicitEvidence('Tools: Docker, Git', 'skills', 'skill-0')])
  })

  it('links a skill mentioned only in a project bullet to that project', () => {
    const linked = linkSkillEvidence(
      emptyResume({
        skills: [buildResumeSkill({ rawName: 'Docker' }, 0)],
        projects: [buildProjectEntry({ name: 'Infra', description: null, bullets: ['Packaged the CLI with Docker'], technologies: [], url: null }, 0)],
      }),
    )
    expect(linked.skills[0]!.sources).toEqual(['skills-section', 'projects'])
    expect(linked.skills[0]!.evidence[1]).toEqual(explicitEvidence('Packaged the CLI with Docker', 'projects', 'proj-0'))
  })

  it('reindexes positional skill ids and their evidence entryIds together', () => {
    const skills = reindexSkills([buildResumeSkill({ rawName: 'Git' }, 5)])
    expect(skills[0]!.id).toBe('skill-0')
    expect(skills[0]!.evidence[0]!.entryId).toBe('skill-0')
  })

  it('records the taxonomy aliases of a known skill, excluding the spelling used', () => {
    expect(buildResumeSkill({ rawName: 'React.js' }, 0).aliases).toEqual(['react', 'reactjs', 'react js'])
    expect(buildResumeSkill({ rawName: 'Figma' }, 0).aliases).toEqual([])
  })
})

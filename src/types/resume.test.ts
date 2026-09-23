import { describe, expect, it } from 'vitest'
import type { Resume } from './resume'
import {
  buildContactInformation,
  buildEducationEntry,
  buildExperienceEntry,
  buildResumeSkill,
  emptyResume,
  linkSkillEvidence,
} from '@/lib/schema/resumeBuilders'

function buildResume(overrides: Partial<Resume> = {}): Resume {
  return linkSkillEvidence(
    emptyResume({
      id: 'resume-test',
      contact: buildContactInformation({
        name: 'Jordan Rivera',
        email: 'jordan@example.com',
        phone: '555-010-1234',
        location: 'Austin, TX',
        links: [{ type: 'github', url: 'https://github.com/jordanrivera' }],
      }),
      summary: 'Frontend engineer focused on React and design systems.',
      skills: [buildResumeSkill({ rawName: 'react', category: 'framework' }, 0)],
      experience: [
        buildExperienceEntry(
          {
            company: 'Acme Corp',
            title: 'Frontend Engineer',
            startDate: '2021-03-01',
            endDate: null,
            location: 'Remote',
            bullets: ['Built reusable React components used across 4 apps.'],
          },
          0,
        ),
      ],
      education: [
        buildEducationEntry(
          {
            institution: 'University of Texas',
            degree: 'B.S. Computer Science',
            fieldOfStudy: 'Computer Science',
            startDate: '2015-08-01',
            endDate: '2019-05-01',
            location: 'Austin, TX',
          },
          0,
        ),
      ],
      ...overrides,
    }),
  )
}

describe('Resume schema', () => {
  it('accepts a fully populated resume', () => {
    const resume = buildResume()
    expect(resume.contact.name).toBe('Jordan Rivera')
    expect(resume.skills[0]?.evidence.map((e) => e.text)).toContain('Built reusable React components used across 4 apps.')
  })

  it('carries typed evidence pointing back to the section and entry it came from', () => {
    const resume = buildResume()
    const bulletEvidence = resume.skills[0]!.evidence.find((e) => e.section === 'experience')
    expect(bulletEvidence).toEqual({
      text: 'Built reusable React components used across 4 apps.',
      section: 'experience',
      entryId: 'exp-0',
      sourceType: 'explicit',
      confidence: 1,
    })
    expect(resume.skills[0]!.sources).toEqual(['skills-section', 'experience'])
  })

  it('gives every major entity a deterministic id', () => {
    const resume = buildResume()
    expect(resume.skills[0]!.id).toBe('skill-0')
    expect(resume.experience[0]!.id).toBe('exp-0')
    expect(resume.experience[0]!.bullets[0]!.id).toBe('exp-0-bullet-0')
    expect(resume.education[0]!.id).toBe('edu-0')
    expect(buildResume()).toEqual(buildResume())
  })

  it('allows an ongoing role via a null endDate rather than a sentinel string', () => {
    const resume = buildResume()
    expect(resume.experience[0]?.endDate).toBeNull()
  })

  it('allows contact fields to be null when a parser cannot confidently extract them', () => {
    const resume = buildResume({
      contact: buildContactInformation({ name: null, email: null, phone: null, location: null }),
    })
    expect(resume.contact.name).toBeNull()
    expect(resume.contact.evidence).toEqual([])
  })

  it('has schema-complete empty collections for sections the parser found nothing in', () => {
    const resume = buildResume()
    expect(resume.languages).toEqual([])
    expect(resume.awards).toEqual([])
    expect(resume.parserMetadata.parser).toBe('talentlens-rule-based')
  })
})

import { describe, expect, it } from 'vitest'
import type { Resume } from './resume'

function buildResume(overrides: Partial<Resume> = {}): Resume {
  return {
    candidate: {
      name: 'Jordan Rivera',
      email: 'jordan@example.com',
      phone: '555-010-1234',
      location: 'Austin, TX',
      links: [{ type: 'github', url: 'https://github.com/jordanrivera' }],
    },
    summary: 'Frontend engineer focused on React and design systems.',
    skills: [
      { name: 'react', category: 'framework', evidence: ['Built reusable React components used across 4 apps.'] },
    ],
    experience: [
      {
        company: 'Acme Corp',
        title: 'Frontend Engineer',
        startDate: '2021-03-01',
        endDate: null,
        location: 'Remote',
        bullets: ['Built reusable React components used across 4 apps.'],
      },
    ],
    education: [
      {
        institution: 'University of Texas',
        degree: 'B.S. Computer Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2015-08-01',
        endDate: '2019-05-01',
        location: 'Austin, TX',
      },
    ],
    certifications: [],
    projects: [],
    ...overrides,
  }
}

describe('Resume schema', () => {
  it('accepts a fully populated resume', () => {
    const resume = buildResume()
    expect(resume.candidate.name).toBe('Jordan Rivera')
    expect(resume.skills[0]?.evidence).toContain('Built reusable React components used across 4 apps.')
  })

  it('allows an ongoing role via a null endDate rather than a sentinel string', () => {
    const resume = buildResume()
    expect(resume.experience[0]?.endDate).toBeNull()
  })

  it('allows contact fields to be null when a parser cannot confidently extract them', () => {
    const resume = buildResume({
      candidate: { name: null, email: null, phone: null, location: null, links: [] },
    })
    expect(resume.candidate.name).toBeNull()
  })
})

import type { Resume } from '@/types/resume'
import type { AtsAnalysisInput } from './types'

/** A well-formed resume used as a baseline across ATS analyzer tests. */
export function buildTestResume(overrides: Partial<Resume> = {}): Resume {
  return {
    candidate: {
      name: 'Jordan Rivera',
      email: 'jordan@example.com',
      phone: '555-010-1234',
      location: 'Austin, TX',
      links: [],
    },
    summary: 'Frontend engineer with 6 years of experience building React applications.',
    skills: [
      { name: 'React', category: 'framework', evidence: ['React'] },
      { name: 'TypeScript', category: 'language', evidence: ['TypeScript'] },
    ],
    experience: [
      {
        company: 'Acme Corp',
        title: 'Frontend Engineer',
        startDate: '2021-03-01',
        endDate: null,
        location: 'Remote',
        bullets: [
          'Built reusable React components used across 4 production applications.',
          'Reduced page load time by 35% through code splitting.',
        ],
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

export function buildTestInput(overrides: Partial<AtsAnalysisInput> = {}): AtsAnalysisInput {
  return {
    resume: buildTestResume(),
    parserWarnings: [],
    ...overrides,
  }
}

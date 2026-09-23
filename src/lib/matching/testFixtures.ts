import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import type { MatchInput } from './types'

export function buildTestResume(overrides: Partial<Resume> = {}): Resume {
  return {
    candidate: { name: 'Jordan Rivera', email: 'jordan@example.com', phone: null, location: 'Austin, TX', links: [] },
    summary: 'Frontend engineer with 6 years of experience building React applications.',
    skills: [
      { name: 'React', category: 'framework', evidence: ['React'] },
      { name: 'TypeScript', category: 'language', evidence: ['TypeScript'] },
      { name: 'AWS', category: 'platform', evidence: ['AWS'] },
    ],
    experience: [
      {
        company: 'Acme Corp',
        title: 'Frontend Engineer',
        startDate: '2018-06-01',
        endDate: null,
        location: 'Remote',
        bullets: [
          'Built reusable React components used across 4 production applications.',
          'Implemented REST API development for the customer dashboard.',
          'Reduced page load time by 35% through code splitting.',
        ],
      },
    ],
    education: [
      {
        institution: 'University of Texas',
        degree: 'B.S. Computer Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2014-08-01',
        endDate: '2018-05-01',
        location: 'Austin, TX',
      },
    ],
    certifications: [],
    projects: [],
    ...overrides,
  }
}

export function buildTestJobDescription(overrides: Partial<JobDescription> = {}): JobDescription {
  return {
    title: 'Frontend Engineer',
    seniority: null,
    experience: { minimumYears: 5, maximumYears: null },
    requiredSkills: ['React', 'TypeScript', 'Docker'],
    preferredSkills: ['GraphQL'],
    responsibilities: ['Build reusable components for production applications.'],
    education: ["Bachelor's degree in Computer Science or equivalent experience"],
    certifications: [],
    location: 'Austin, TX',
    employmentType: 'full-time',
    keywords: ['react', 'typescript', 'docker', 'graphql'],
    technologies: [],
    softSkills: [],
    domainTerms: [],
    rawText: '',
    ...overrides,
  }
}

export function buildTestMatchInput(overrides: Partial<MatchInput> = {}): MatchInput {
  return {
    resume: buildTestResume(),
    jobDescription: buildTestJobDescription(),
    ...overrides,
  }
}

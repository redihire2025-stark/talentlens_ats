import type { Resume } from '@/types/resume'
import type { AtsAnalysisInput } from './types'
import {
  buildContactInformation,
  buildEducationEntries,
  buildExperienceEntries,
  buildResumeSkills,
  emptyResume,
  linkSkillEvidence,
} from '@/lib/schema/resumeBuilders'

/** A well-formed resume used as a baseline across ATS analyzer tests. Built through the same schema builders the parser uses, so every derived field (ids, evidence, bullet entities) is real. */
export function buildTestResume(overrides: Partial<Resume> = {}): Resume {
  return linkSkillEvidence(
    emptyResume({
      id: 'resume-test',
      contact: buildContactInformation({
        name: 'Jordan Rivera',
        email: 'jordan@example.com',
        phone: '555-010-1234',
        location: 'Austin, TX',
      }),
      summary: 'Frontend engineer with 6 years of experience building React applications.',
      skills: buildResumeSkills([
        { rawName: 'React', category: 'framework' },
        { rawName: 'TypeScript', category: 'language' },
      ]),
      experience: buildExperienceEntries([
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
      ]),
      education: buildEducationEntries([
        {
          institution: 'University of Texas',
          degree: 'B.S. Computer Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2015-08-01',
          endDate: '2019-05-01',
          location: 'Austin, TX',
        },
      ]),
      ...overrides,
    }),
  )
}

export function buildTestInput(overrides: Partial<AtsAnalysisInput> = {}): AtsAnalysisInput {
  return {
    resume: buildTestResume(),
    parserWarnings: [],
    ...overrides,
  }
}

import type { Resume } from '@/types/resume'
import type { JobDescription, JobRequirement, Keyword } from '@/types/jobDescription'
import type { MatchInput } from './types'
import {
  buildContactInformation,
  buildEducationEntries,
  buildExperienceEntries,
  buildResumeSkills,
  emptyResume,
  linkSkillEvidence,
} from '@/lib/schema/resumeBuilders'
import { buildJobRequirement, buildJobRequirements, buildKeywords, emptyJobDescription } from '@/lib/schema/jdBuilders'

export function buildTestResume(overrides: Partial<Resume> = {}): Resume {
  return linkSkillEvidence(
    emptyResume({
      id: 'resume-test',
      contact: buildContactInformation({ name: 'Jordan Rivera', email: 'jordan@example.com', phone: null, location: 'Austin, TX' }),
      summary: 'Frontend engineer with 6 years of experience building React applications.',
      skills: buildResumeSkills([
        { rawName: 'React', category: 'framework' },
        { rawName: 'TypeScript', category: 'language' },
        { rawName: 'AWS', category: 'platform' },
      ]),
      experience: buildExperienceEntries([
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
      ]),
      education: buildEducationEntries([
        {
          institution: 'University of Texas',
          degree: 'B.S. Computer Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2014-08-01',
          endDate: '2018-05-01',
          location: 'Austin, TX',
        },
      ]),
      ...overrides,
    }),
  )
}

/** A single ad-hoc skill requirement, for testing a matcher on one term. */
export function testRequirement(rawText: string, id = 'req-test'): JobRequirement {
  return buildJobRequirement({ rawText, category: 'skill', priority: 'required' }, id)
}

type RequirementList = (string | JobRequirement)[]

/** Test-only override shape: requirement lists may be given as plain strings for readability; they're built into typed requirements exactly as the JD parser would. */
export type TestJobDescriptionOverrides = Omit<
  Partial<JobDescription>,
  'requiredSkills' | 'preferredSkills' | 'education' | 'certifications' | 'keywords'
> & {
  requiredSkills?: RequirementList
  preferredSkills?: RequirementList
  education?: RequirementList
  certifications?: RequirementList
  keywords?: (string | Keyword)[]
}

function toRequirements(list: RequirementList, options: Parameters<typeof buildJobRequirements>[1]): JobRequirement[] {
  return list.map((item, index) =>
    typeof item === 'string' ? buildJobRequirements([item], options).map((r) => ({ ...r, id: `${options.idPrefix}-${index}` }))[0]! : item,
  )
}

/**
 * Keywords default to the distinct union of the (possibly overridden)
 * required + preferred skills — exactly how the JD parser derives them —
 * unless given explicitly.
 */
export function buildTestJobDescription(overrides: TestJobDescriptionOverrides = {}): JobDescription {
  const { requiredSkills, preferredSkills, education, certifications, keywords, ...rest } = overrides
  const required = toRequirements(requiredSkills ?? ['React', 'TypeScript', 'Docker'], { category: 'skill', priority: 'required', idPrefix: 'req-required' })
  const preferred = toRequirements(preferredSkills ?? ['GraphQL'], { category: 'skill', priority: 'preferred', idPrefix: 'req-preferred' })

  const derivedKeywords = buildKeywords(required, preferred)
  const keywordList =
    keywords === undefined
      ? derivedKeywords
      : buildKeywords(
          toRequirements(
            keywords.map((k) => (typeof k === 'string' ? k : { ...k, category: 'skill' as const })),
            { category: 'skill', priority: 'required', idPrefix: 'kw-src' },
          ),
          [],
        )

  return emptyJobDescription({
    id: 'jd-test',
    title: 'Frontend Engineer',
    seniority: null,
    experience: { minimumYears: 5, maximumYears: null },
    requiredSkills: required,
    preferredSkills: preferred,
    responsibilities: ['Build reusable components for production applications.'],
    education: toRequirements(education ?? ["Bachelor's degree in Computer Science or equivalent experience"], {
      category: 'education',
      priority: 'required',
      idPrefix: 'edu',
    }),
    certifications: toRequirements(certifications ?? [], { category: 'certification', priority: 'required', idPrefix: 'cert' }),
    location: 'Austin, TX',
    employmentType: 'full-time',
    keywords: keywordList,
    rawText: '',
    ...rest,
  })
}

export function buildTestMatchInput(overrides: Partial<MatchInput> = {}): MatchInput {
  return {
    resume: buildTestResume(),
    jobDescription: buildTestJobDescription(),
    ...overrides,
  }
}

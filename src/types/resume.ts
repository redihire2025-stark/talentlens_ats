import type { ISODateString, Nullable } from './common'

/** Broad classification used to group skills for display and scoring. */
export type SkillCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'database'
  | 'platform'
  | 'tool'
  | 'methodology'
  | 'soft-skill'
  | 'other'

/**
 * A skill the candidate has, with the resume text that supports it.
 * `evidence` holds the literal snippet(s) — a bullet, a summary line, a
 * skills-list entry — the skill was extracted from, so every skill is
 * traceable back to something the candidate actually wrote. Never invented.
 */
export interface Skill {
  name: string
  category: SkillCategory
  evidence: string[]
}

export type CandidateLinkType = 'linkedin' | 'github' | 'portfolio' | 'website' | 'other'

export interface CandidateLink {
  type: CandidateLinkType
  url: string
}

/**
 * Contact fields are nullable rather than required: a parser may fail to
 * confidently extract any of them from a given document, and guessing
 * would risk fabricating contact info. See docs/architecture/resume-schema.md.
 */
export interface Candidate {
  name: Nullable<string>
  email: Nullable<string>
  phone: Nullable<string>
  location: Nullable<string>
  links: CandidateLink[]
}

export interface ExperienceEntry {
  company: string
  title: string
  startDate: Nullable<ISODateString>
  /** null means the role is ongoing ("Present"). */
  endDate: Nullable<ISODateString>
  location: Nullable<string>
  bullets: string[]
}

export interface EducationEntry {
  institution: string
  degree: Nullable<string>
  fieldOfStudy: Nullable<string>
  startDate: Nullable<ISODateString>
  endDate: Nullable<ISODateString>
  location: Nullable<string>
}

export interface Certification {
  name: string
  issuer: Nullable<string>
  issueDate: Nullable<ISODateString>
  expirationDate: Nullable<ISODateString>
}

export interface Project {
  name: string
  description: Nullable<string>
  bullets: string[]
  technologies: string[]
  url: Nullable<string>
}

/**
 * The canonical, strongly-typed representation of a resume. Every later
 * stage (normalization, ATS analysis, matching, recommendations,
 * versioning, export) reads and writes this shape — see
 * docs/architecture/resume-schema.md for field-by-field rationale.
 */
export interface Resume {
  candidate: Candidate
  summary: Nullable<string>
  skills: Skill[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
  certifications: Certification[]
  projects: Project[]
}

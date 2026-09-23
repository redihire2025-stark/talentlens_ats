import type { Nullable } from './common'

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'other'

export interface ExperienceRequirement {
  minimumYears: Nullable<number>
  maximumYears: Nullable<number>
}

/**
 * The canonical, strongly-typed representation of a job description. Unlike
 * `Resume`, skills/education/certifications here are plain string arrays —
 * a JD states requirements, it doesn't carry "evidence" the way a resume
 * does, so there's nothing a richer per-item shape would add yet. See
 * docs/architecture/jd-schema.md.
 */
export interface JobDescription {
  title: Nullable<string>
  /** e.g. "senior", "staff" — from `titleSeniority`'s `SeniorityLevel`, kept as a plain string here so a JD with no recognizable level doesn't need a sentinel value beyond `null`. */
  seniority: Nullable<string>
  experience: ExperienceRequirement
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  education: string[]
  certifications: string[]
  location: Nullable<string>
  employmentType: Nullable<EmploymentType>
  keywords: string[]
  /** Technologies mentioned in prose (responsibilities, overview) that weren't stated as a required/preferred skill — signal, not a hard requirement. */
  technologies: string[]
  /** Soft skills mentioned anywhere in the posting (communication, leadership, …). */
  softSkills: string[]
  /** Repeated all-caps acronyms/jargon (HIPAA, SOC2, GDPR, …) not already captured as a skill — see `extractDomainTerms`. */
  domainTerms: string[]
  /** The full extracted JD text, kept for AI-assisted semantic matching/explanation (PRD §14) and for re-parsing without re-uploading. */
  rawText: string
}

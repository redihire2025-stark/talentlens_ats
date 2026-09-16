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
  experience: ExperienceRequirement
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  education: string[]
  certifications: string[]
  location: Nullable<string>
  employmentType: Nullable<EmploymentType>
  keywords: string[]
}

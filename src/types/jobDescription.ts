import type { Nullable } from './common'

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'other'

export interface ExperienceRequirement {
  minimumYears: Nullable<number>
  maximumYears: Nullable<number>
}

/**
 * The spec's five requirement categories (`skill`, `technology`, `keyword`,
 * `domain`, `soft-skill`), plus `education` and `certification` so the
 * JD's education/certification lines can use the same typed shape (and
 * carry an `id` a `HardRequirement` can point back to).
 */
export type RequirementCategory = 'skill' | 'technology' | 'keyword' | 'domain' | 'soft-skill' | 'education' | 'certification'

/**
 * `required` — stated in a requirements/qualifications section (or the
 * line itself says "required"). `preferred` — stated in a preferred/nice-
 * to-have section, or the line itself says "preferred"/"a plus". `optional`
 * — only *mentioned* (in responsibilities or overview prose), never stated
 * as a requirement; matched for signal, never a hard gate.
 */
export type RequirementPriority = 'required' | 'preferred' | 'optional'

/**
 * One typed requirement mined from the JD. `rawText` is what the JD
 * literally says ("React.js"); `canonicalTerm` is its normalized form
 * ("react") — matching compares on `canonicalTerm`, display uses `rawText`.
 */
export interface JobRequirement {
  /** Positional per list: `req-required-0`, `req-preferred-1`, `tech-0`, `soft-0`, `edu-0`, `cert-0`, … */
  id: string
  rawText: string
  canonicalTerm: string
  category: RequirementCategory
  priority: RequirementPriority
  /** Set only when the same JD line states a years figure alongside this term ("3+ years of React"). */
  minimumYears?: number
  /** The verbatim JD line this requirement was extracted from, when that differs from `rawText` (i.e. mined from prose or a labelled list line). */
  evidence?: string
  /** 1 for an item stated in a comma/pipe list or its own line; 0.8 for a term mined from prose via the taxonomy — see docs/architecture/jd-schema.md. */
  confidence: number
}

/** Same shape as `JobRequirement`, with the simpler keyword/domain category. */
export type Keyword = Omit<JobRequirement, 'category'> & { category: 'keyword' | 'domain' }

/**
 * The canonical, strongly-typed representation of a job description. See
 * docs/architecture/jd-schema.md.
 */
export interface JobDescription {
  /** `jd-<hash of the JD text>` — content-derived and deterministic. */
  id: string
  title: Nullable<string>
  /** e.g. "senior", "staff" — from `titleSeniority`'s `SeniorityLevel`, kept as a plain string here so a JD with no recognizable level doesn't need a sentinel value beyond `null`. */
  seniority: Nullable<string>
  experience: ExperienceRequirement
  requiredSkills: JobRequirement[]
  preferredSkills: JobRequirement[]
  /** Kept as plain lines: a responsibility is prose, compared by token overlap, not a canonicalizable term. */
  responsibilities: string[]
  education: JobRequirement[]
  certifications: JobRequirement[]
  location: Nullable<string>
  employmentType: Nullable<EmploymentType>
  /** Distinct (by canonical term) union of required + preferred skills — what the keyword-coverage score component matches against. */
  keywords: Keyword[]
  /** Technologies mentioned in prose (responsibilities, overview) that weren't stated as a required/preferred skill — `priority: 'optional'`, signal only. */
  technologies: JobRequirement[]
  /** Soft skills mentioned anywhere in the posting (communication, leadership, …) — `priority: 'optional'`. */
  softSkills: JobRequirement[]
  /** Repeated all-caps acronyms/jargon (HIPAA, SOC2, GDPR, …) not already captured as a skill — see `extractDomainTerms`. */
  domainTerms: Keyword[]
  /** The JD parser's warnings — the same list `parseJobDescriptionText` also returns. */
  parserWarnings: string[]
  /** The full extracted JD text, kept for AI-assisted semantic matching/explanation (PRD §14) and for re-parsing without re-uploading. */
  rawText: string
}

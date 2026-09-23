import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import type { MatchStatus } from '@/types/score'
import type { Evidence } from '@/types/evidence'

export interface MatchInput {
  resume: Resume
  jobDescription: JobDescription
}

/**
 * How a skill was matched, in the order the deterministic layers run (see
 * docs/scoring/matching-rules.md). `none` means no layer produced a match —
 * paired with `status: 'missing'`.
 */
export type MatchType = 'exact' | 'normalized' | 'synonym' | 'fuzzy' | 'semantic' | 'none'

/**
 * The spec's `MatchResult` (§19): one JD requirement compared against the
 * resume. Every field is derived from what was or wasn't found — never
 * fabricated.
 */
export interface MatchResult {
  /** The `JobRequirement.id` (or `Keyword.id`) this result is for. */
  requirementId: string
  /** The JD's original, as-written requirement text (e.g. "React.js"). */
  requirement: string
  /** The requirement's canonical (normalized) term (e.g. "react"). */
  normalizedTerm: string
  status: MatchStatus
  matchType: MatchType
  /** 0-1. 1 for an exact/normalized match; lower for synonym-in-bullet and fuzzy; always 1 for a confirmed `missing` (certain there's no evidence). */
  confidence: number
  /** Typed pointers to the resume text supporting this status; empty when missing. */
  evidence: Evidence[]
  /** One human-readable sentence explaining the status — never fabricated, always derived from what was/wasn't found. */
  reason: string
}

export interface SkillMatchResult {
  required: MatchResult[]
  preferred: MatchResult[]
}

export interface TitleMatchResult {
  status: MatchStatus
  /** False when the JD didn't state a title at all — there was nothing to check. */
  required: boolean
  jdTitle: string | null
  resumeTitle: string | null
  explanation: string
  /** The matching experience entry's title line, when one matched or partially matched. */
  evidence: Evidence[]
}

export interface ExperienceMatchResult {
  status: MatchStatus
  required: boolean
  candidateYears: number | null
  requiredMinimumYears: number | null
  requiredMaximumYears: number | null
  explanation: string
  /** The dated experience entries' meta lines the years figure was computed from. */
  evidence: Evidence[]
}

/** One JD education requirement line compared against the resume's education. */
export interface EducationRequirementMatch {
  requirementId: string
  requirement: string
  status: MatchStatus
  evidence: Evidence[]
}

export interface EducationMatchResult {
  status: MatchStatus
  required: boolean
  /** Per-requirement results, in JD order. */
  requirements: EducationRequirementMatch[]
  /** Raw text of every `matched` requirement (convenience view over `requirements`). */
  matchedRequirements: string[]
  /** Raw text of every `partial` or `missing` requirement. */
  missingRequirements: string[]
}

export interface ResponsibilityMatchEntry {
  responsibility: string
  status: MatchStatus
  /** The best-overlapping resume bullet, when `matched`/`partial`; empty when `missing`. */
  evidence: Evidence[]
}

export type HardRequirementType =
  | 'minimum-experience'
  | 'certification'
  | 'license'
  | 'education'
  | 'work-authorization'
  | 'location'
  | 'required-skill'

/**
 * A pass/fail requirement that must never disappear inside the overall Job
 * Match score (spec §11/§29): a missing hard requirement is reported
 * independently, not averaged away by everything the candidate got right.
 * The union lists all seven spec types; `hardRequirements.ts` detects the
 * four this codebase has real signal for (`minimum-experience`,
 * `required-skill`, `education`, `location`) — see that file and
 * docs/architecture/ats-engine-spec-gap.md for why `certification`,
 * `license`, and `work-authorization` are not detected.
 */
export interface HardRequirement {
  id: string
  type: HardRequirementType
  /** The `JobRequirement.id` this was derived from, when there is one (required skills, education lines). */
  requirementId?: string
  /** The JD text this requirement was derived from, as written. */
  requirementText: string
  satisfied: boolean
  /** Typed resume evidence supporting `satisfied`; empty when nothing supports it. */
  evidence: Evidence[]
  /** One human-readable sentence explaining why this is/isn't satisfied. */
  reason: string
}

export interface MatchAnalysis {
  skills: SkillMatchResult
  title: TitleMatchResult
  experience: ExperienceMatchResult
  education: EducationMatchResult
  responsibilities: ResponsibilityMatchEntry[]
  /** Hard requirements detected for this resume/JD pair — see `HardRequirement`. Always present (possibly empty), never merged into `skills`/`experience` above. */
  hardRequirements: HardRequirement[]
}

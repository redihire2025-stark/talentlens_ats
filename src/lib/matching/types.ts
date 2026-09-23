import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import type { MatchStatus } from '@/types/score'

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

export interface SkillMatchEntry {
  /** The JD's original, as-written requirement text (e.g. "React.js"). */
  requirement: string
  /** The JD skill's canonical (normalized) name (e.g. "react") — see PRD §12. */
  skill: string
  status: MatchStatus
  matchType: MatchType
  /** 0-1. 1 for an exact/normalized match; lower for fuzzy; always 1 for a confirmed `missing` (certain there's no evidence). */
  confidence: number
  /** Resume text (a skill name or bullet) supporting this status; empty when missing. This is PRD §12's `resumeEvidence`, named `evidence` here for consistency with the rest of this file. */
  evidence: string[]
  /** One human-readable sentence explaining the status — never fabricated, always derived from what was/wasn't found. */
  reason: string
}

export interface SkillMatchResult {
  required: SkillMatchEntry[]
  preferred: SkillMatchEntry[]
}

export interface TitleMatchResult {
  status: MatchStatus
  /** False when the JD didn't state a title at all — there was nothing to check. */
  required: boolean
  jdTitle: string | null
  resumeTitle: string | null
  explanation: string
}

export interface ExperienceMatchResult {
  status: MatchStatus
  required: boolean
  candidateYears: number | null
  requiredMinimumYears: number | null
  requiredMaximumYears: number | null
  explanation: string
}

export interface EducationMatchResult {
  status: MatchStatus
  required: boolean
  matchedRequirements: string[]
  missingRequirements: string[]
}

export interface ResponsibilityMatchEntry {
  responsibility: string
  status: MatchStatus
}

/**
 * A pass/fail requirement that must never disappear inside the overall Job
 * Match score (spec §11/§29): a missing hard requirement is reported
 * independently, not averaged away by everything the candidate got right.
 * Only the two types this codebase already has reliable signal for are
 * detected — `minimum-experience` (from the JD's stated
 * `experience.minimumYears`, reusing `matchExperience`'s own status) and
 * `required-skill` (one entry per `jobDescription.requiredSkills`, reusing
 * `matchSkills`'s own status) — see `hardRequirements.ts` and
 * `docs/architecture/ats-engine-spec-gap.md` for why the spec's other hard
 * requirement types (`certification`, `license`, `education`,
 * `work-authorization`, `location`) aren't detected here.
 */
export interface HardRequirement {
  id: string
  type: 'minimum-experience' | 'certification' | 'license' | 'education' | 'work-authorization' | 'location' | 'required-skill'
  /** The JD text this requirement was derived from, as written. */
  requirementText: string
  satisfied: boolean
  /** Verbatim resume text supporting `satisfied`; empty when not satisfied. */
  evidence: string[]
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

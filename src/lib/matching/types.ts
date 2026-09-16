import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import type { MatchStatus } from '@/types/score'

export interface MatchInput {
  resume: Resume
  jobDescription: JobDescription
}

export interface SkillMatchEntry {
  /** The JD skill's canonical (normalized) name. */
  skill: string
  status: MatchStatus
  /** Resume text (a skill name or bullet) supporting this status; empty when missing. */
  evidence: string[]
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

export interface MatchAnalysis {
  skills: SkillMatchResult
  title: TitleMatchResult
  experience: ExperienceMatchResult
  education: EducationMatchResult
  responsibilities: ResponsibilityMatchEntry[]
}

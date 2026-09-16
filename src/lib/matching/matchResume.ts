import type { MatchAnalysis, MatchInput } from './types'
import { matchSkills } from './skillMatcher'
import { matchTitle } from './titleMatcher'
import { matchExperience } from './experienceMatcher'
import { matchEducation } from './educationMatcher'
import { matchResponsibilities } from './responsibilityMatcher'

/**
 * Runs every matcher over a resume/JD pair. Produces the structured
 * per-category results the score engine (TASK-010) combines into the JD
 * Match Score — this module deliberately stops short of computing that
 * final number, keeping "does X match Y" separate from "how much does
 * that matter".
 */
export function matchResume(input: MatchInput): MatchAnalysis {
  return {
    skills: {
      required: matchSkills(input.jobDescription.requiredSkills, input.resume),
      preferred: matchSkills(input.jobDescription.preferredSkills, input.resume),
    },
    title: matchTitle(input),
    experience: matchExperience(input),
    education: matchEducation(input),
    responsibilities: matchResponsibilities(input),
  }
}

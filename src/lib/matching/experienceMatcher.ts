import type { MatchInput, ExperienceMatchResult } from './types'

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25
/** Within this many years of the stated minimum, treat as "close" rather than an outright gap. */
const PARTIAL_TOLERANCE_YEARS = 1

/**
 * Total years of experience, computed as the calendar span from the
 * earliest start date to the latest end date (or `referenceDate`, for an
 * ongoing role) — not the sum of each entry's duration, which would
 * double-count overlapping or concurrent roles. This is a reasonable
 * proxy, not a precise reconstruction of a career timeline with gaps.
 *
 * `referenceDate` is an explicit parameter, not an internal `new Date()`
 * call, so this function is a pure function of its inputs: called twice
 * with the same resume and the same `referenceDate`, it always returns the
 * same result (the ATS engine spec's determinism principle — see
 * docs/product/ats-engine-spec.md §4 — forbids *hidden* wall-clock
 * dependence inside scoring logic, not a legitimate, explicit "years since
 * X, as of a given date" calculation, which a resume tool genuinely needs
 * to answer well for an ongoing role). It defaults to the real current
 * date so normal callers get accurate, current results without having to
 * pass one.
 */
export function calculateYearsOfExperience(resume: MatchInput['resume'], referenceDate: Date = new Date()): number {
  if (resume.experience.length === 0) return 0

  const starts = resume.experience.map((entry) => (entry.startDate ? new Date(entry.startDate).getTime() : null)).filter((t): t is number => t !== null)
  if (starts.length === 0) return 0

  const referenceTime = referenceDate.getTime()
  const ends = resume.experience.map((entry) => (entry.endDate ? new Date(entry.endDate).getTime() : referenceTime))

  const earliestStart = Math.min(...starts)
  const latestEnd = Math.max(...ends)

  return Math.max(0, (latestEnd - earliestStart) / MS_PER_YEAR)
}

/** Never fabricates experience: a resume with no evidence of enough years is reported as `missing`, not rounded up. */
export function matchExperience({ resume, jobDescription }: MatchInput, referenceDate: Date = new Date()): ExperienceMatchResult {
  const { minimumYears, maximumYears } = jobDescription.experience
  const candidateYears = resume.experience.length > 0 ? calculateYearsOfExperience(resume, referenceDate) : null
  // The meta lines (with their dates) of every dated entry the years figure is computed from.
  const evidence = resume.experience.filter((entry) => entry.startDate).flatMap((entry) => entry.evidence)

  if (minimumYears === null && maximumYears === null) {
    return {
      status: 'matched',
      required: false,
      candidateYears,
      requiredMinimumYears: null,
      requiredMaximumYears: null,
      explanation: 'The job description did not state a specific years-of-experience requirement.',
      evidence,
    }
  }

  if (candidateYears === null) {
    return {
      status: 'missing',
      required: true,
      candidateYears: null,
      requiredMinimumYears: minimumYears,
      requiredMaximumYears: maximumYears,
      explanation: 'No dated work experience was found to evaluate against the experience requirement.',
      evidence: [],
    }
  }

  const roundedYears = Math.round(candidateYears * 10) / 10
  const meetsMinimum = minimumYears === null || candidateYears >= minimumYears
  const withinMaximum = maximumYears === null || candidateYears <= maximumYears + PARTIAL_TOLERANCE_YEARS

  if (meetsMinimum && withinMaximum) {
    return {
      status: 'matched',
      required: true,
      candidateYears: roundedYears,
      requiredMinimumYears: minimumYears,
      requiredMaximumYears: maximumYears,
      explanation: `${roundedYears} years of experience found, meeting the requirement.`,
      evidence,
    }
  }

  const isClose = minimumYears !== null && candidateYears >= minimumYears - PARTIAL_TOLERANCE_YEARS

  return {
    status: isClose ? 'partial' : 'missing',
    required: true,
    candidateYears: roundedYears,
    requiredMinimumYears: minimumYears,
    requiredMaximumYears: maximumYears,
    explanation: isClose
      ? `${roundedYears} years of experience found, close to the ${minimumYears}-year requirement.`
      : `${roundedYears} years of experience found, below the ${minimumYears ?? '?'}-year requirement.`,
    evidence,
  }
}

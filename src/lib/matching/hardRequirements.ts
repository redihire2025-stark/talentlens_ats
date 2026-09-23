import type { MatchAnalysis, MatchInput, HardRequirement } from './types'

/**
 * Detects the "hard requirements" subset of a Job Match analysis (spec
 * §11/§29) — pass/fail conditions that must be reported independently of
 * the overall score, never buried inside an average. This runs *after*
 * `matchSkills`/`matchExperience` (via the already-computed `MatchAnalysis`)
 * rather than re-implementing matching logic, so a hard requirement's
 * `satisfied`/`evidence`/`reason` always agree with the corresponding entry
 * in `analysis.skills`/`analysis.experience`.
 *
 * Only two of the spec's seven `HardRequirement` types are built here:
 *
 * - `minimum-experience` — the JD's `experience.minimumYears`, one entry,
 *   satisfied when `matchExperience` returned `matched`.
 * - `required-skill` — one entry per `jobDescription.requiredSkills`,
 *   satisfied when the corresponding `matchSkills` entry is `matched`.
 *
 * The other five (`certification`, `license`, `education`,
 * `work-authorization`, `location`) aren't detected: the current JD schema
 * has no `certifications`/`licenses`/work-authorization/location
 * *requirement* fields with matching signal comparable to what
 * `requiredSkills`/`experience` already have — inventing detection for them
 * would mean guessing at data the parser doesn't reliably extract yet. See
 * `docs/architecture/ats-engine-spec-gap.md`.
 */
export function detectHardRequirements(input: MatchInput, analysis: Pick<MatchAnalysis, 'skills' | 'experience'>): HardRequirement[] {
  const requirements: HardRequirement[] = []

  const { minimumYears } = input.jobDescription.experience
  if (minimumYears !== null) {
    const satisfied = analysis.experience.status === 'matched'
    requirements.push({
      id: 'hard-requirement-minimum-experience',
      type: 'minimum-experience',
      requirementText: `${minimumYears}+ years of experience`,
      satisfied,
      evidence: satisfied && analysis.experience.candidateYears !== null ? [`${analysis.experience.candidateYears} years of experience found.`] : [],
      reason: analysis.experience.explanation,
    })
  }

  for (const entry of analysis.skills.required) {
    const satisfied = entry.status === 'matched'
    requirements.push({
      id: `hard-requirement-required-skill-${entry.skill}`,
      type: 'required-skill',
      requirementText: entry.requirement,
      satisfied,
      evidence: entry.evidence,
      reason: entry.reason,
    })
  }

  return requirements
}

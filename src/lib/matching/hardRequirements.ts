import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import { explicitEvidence, structuralEvidence } from '@/lib/schema/evidence'
import type { MatchAnalysis, MatchInput, HardRequirement } from './types'

/**
 * Detects the "hard requirements" subset of a Job Match analysis (spec
 * §11/§29) — pass/fail conditions reported independently of the overall
 * score, never buried inside an average. This runs *after* the matchers
 * (via the already-computed `MatchAnalysis`) rather than re-implementing
 * matching logic, so a hard requirement's `satisfied`/`evidence`/`reason`
 * always agree with the corresponding matcher result.
 *
 * Detected (four of the spec's seven types — each has a real, typed JD
 * field and a real resume field to compare it against):
 *
 * - `minimum-experience` — the JD's `experience.minimumYears`; satisfied
 *   when `matchExperience` returned `matched`.
 * - `required-skill` — one per `jobDescription.requiredSkills`; satisfied
 *   when that requirement's `MatchResult` is `matched`.
 * - `education` — one per JD education line with `priority: 'required'`
 *   (a line saying "preferred" is not a hard gate); satisfied when
 *   `matchEducation` marked that line `matched`.
 * - `location` — the JD's stated location vs. the resume's contact
 *   location; skipped entirely for a remote role (nothing to check).
 *
 * Not detected — `certification`, `license`, `work-authorization`: the
 * union includes them so the schema is complete, but there's no reliable
 * signal yet. JD certification lines are free text with no taxonomy to
 * canonicalize against (a name-similarity guess could fabricate a "met"
 * credential), the JD parser has no license/work-authorization extraction
 * at all, and resumes rarely state work authorization. See
 * docs/architecture/ats-engine-spec-gap.md.
 */
export function detectHardRequirements(
  input: MatchInput,
  analysis: Pick<MatchAnalysis, 'skills' | 'experience'> & Partial<Pick<MatchAnalysis, 'education'>>,
): HardRequirement[] {
  const requirements: HardRequirement[] = []

  const { minimumYears } = input.jobDescription.experience
  if (minimumYears !== null) {
    const satisfied = analysis.experience.status === 'matched'
    requirements.push({
      id: 'hard-requirement-minimum-experience',
      type: 'minimum-experience',
      requirementText: `${minimumYears}+ years of experience`,
      satisfied,
      evidence:
        satisfied && analysis.experience.candidateYears !== null
          ? [
              structuralEvidence(`${analysis.experience.candidateYears} years of experience found across dated roles.`, 'experience'),
              ...analysis.experience.evidence,
            ]
          : [],
      reason: analysis.experience.explanation,
    })
  }

  for (const entry of analysis.skills.required) {
    const satisfied = entry.status === 'matched'
    requirements.push({
      id: `hard-requirement-required-skill-${entry.requirementId}`,
      type: 'required-skill',
      requirementId: entry.requirementId,
      requirementText: entry.requirement,
      satisfied,
      evidence: entry.evidence,
      reason: entry.reason,
    })
  }

  for (const match of analysis.education?.requirements ?? []) {
    const jdRequirement = input.jobDescription.education.find((r) => r.id === match.requirementId)
    if (jdRequirement?.priority !== 'required') continue
    requirements.push({
      id: `hard-requirement-education-${match.requirementId}`,
      type: 'education',
      requirementId: match.requirementId,
      requirementText: match.requirement,
      satisfied: match.status === 'matched',
      evidence: match.evidence,
      reason: match.reason,
    })
  }

  const location = detectLocationRequirement(input.jobDescription, input.resume)
  if (location) requirements.push(location)

  return requirements
}

const REMOTE_RE = /\bremote\b/i

function normalizeLocation(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9,\s]/g, '').replace(/\s+/g, ' ').trim()
}

/** "Austin, TX" → "austin" — the part before the first comma, for a same-city comparison that tolerates "Austin, Texas" vs "Austin, TX". */
function cityOf(value: string): string {
  return normalizeLocation(value).split(',')[0]!.trim()
}

/**
 * A location stated in the JD, compared against the resume's contact
 * location. Deliberately literal: the same city (or the exact same string)
 * is satisfied; anything else is reported, not judged — the resume can't
 * show willingness to relocate or commute, so the reason says so rather
 * than implying the candidate is ineligible.
 */
function detectLocationRequirement(jobDescription: JobDescription, resume: Resume): HardRequirement | null {
  const jdLocation = jobDescription.location?.trim()
  if (!jdLocation || REMOTE_RE.test(jdLocation)) return null

  const base = { id: 'hard-requirement-location', type: 'location' as const, requirementText: `Location: ${jdLocation}` }
  const resumeLocation = resume.contact.location?.trim()

  if (!resumeLocation) {
    return {
      ...base,
      satisfied: false,
      evidence: [],
      reason: `The role is based in ${jdLocation}, and no location was found on your resume to compare against.`,
    }
  }

  const satisfied =
    normalizeLocation(resumeLocation) === normalizeLocation(jdLocation) || (cityOf(resumeLocation) !== '' && cityOf(resumeLocation) === cityOf(jdLocation))

  const evidence = satisfied
    ? [resume.contact.evidence.find((e) => e.text.includes(resumeLocation)) ?? explicitEvidence(resumeLocation, 'contact')]
    : []

  return {
    ...base,
    satisfied,
    evidence,
    reason: satisfied
      ? `Your resume lists ${resumeLocation}, which matches the role's location (${jdLocation}).`
      : `The role is based in ${jdLocation}; your resume lists ${resumeLocation}. A resume can't show willingness to relocate or commute — if that applies, say so in your application.`,
  }
}

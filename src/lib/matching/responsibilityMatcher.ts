import type { MatchInput, ResponsibilityMatchEntry } from './types'
import { tokenOverlapRatio } from './fuzzyMatch'

/** Thresholds for prose-to-prose comparison — looser than the skill matcher's, since responsibilities are naturally full sentences, not single terms. */
const MATCHED_THRESHOLD = 0.5
const PARTIAL_THRESHOLD = 0.25

/**
 * Compares each JD responsibility against every resume bullet (experience
 * and projects) via token overlap — the fuzzy layer is the *primary* one
 * here, unlike skill matching, because responsibilities are prose, not
 * canonicalizable terms.
 */
export function matchResponsibilities({ resume, jobDescription }: MatchInput): ResponsibilityMatchEntry[] {
  const bullets = [...resume.experience.flatMap((entry) => entry.bullets), ...resume.projects.flatMap((project) => project.bullets)]

  return jobDescription.responsibilities.map((responsibility) => {
    const bestRatio = Math.max(0, ...bullets.map((bullet) => tokenOverlapRatio(responsibility, bullet)))

    const status = bestRatio >= MATCHED_THRESHOLD ? 'matched' : bestRatio >= PARTIAL_THRESHOLD ? 'partial' : 'missing'

    return { responsibility, status }
  })
}

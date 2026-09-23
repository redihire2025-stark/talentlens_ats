import type { Evidence } from '@/types/evidence'
import { explicitEvidence } from '@/lib/schema/evidence'
import type { MatchInput, ResponsibilityMatchEntry } from './types'
import { tokenOverlapRatio } from './fuzzyMatch'

/** Thresholds for prose-to-prose comparison — looser than the skill matcher's, since responsibilities are naturally full sentences, not single terms. */
const MATCHED_THRESHOLD = 0.5
const PARTIAL_THRESHOLD = 0.25

/**
 * Compares each JD responsibility against every resume bullet (experience
 * and projects) via token overlap — the fuzzy layer is the *primary* one
 * here, unlike skill matching, because responsibilities are prose, not
 * canonicalizable terms. The best-overlapping bullet is the evidence (its
 * `confidence` is the overlap ratio) whenever the status isn't `missing`.
 */
export function matchResponsibilities({ resume, jobDescription }: MatchInput): ResponsibilityMatchEntry[] {
  const bullets: { text: string; evidence: (confidence: number) => Evidence }[] = [
    ...resume.experience.flatMap((entry) =>
      entry.bullets.map((bullet) => ({ text: bullet.text, evidence: (c: number) => explicitEvidence(bullet.text, 'experience', entry.id, c) })),
    ),
    ...resume.projects.flatMap((project) =>
      project.bullets.map((text) => ({ text, evidence: (c: number) => explicitEvidence(text, 'projects', project.id, c) })),
    ),
  ]

  return jobDescription.responsibilities.map((responsibility) => {
    let best: { bullet: (typeof bullets)[number]; ratio: number } | null = null
    for (const bullet of bullets) {
      const ratio = tokenOverlapRatio(responsibility, bullet.text)
      if (!best || ratio > best.ratio) best = { bullet, ratio }
    }
    const bestRatio = best?.ratio ?? 0

    const status = bestRatio >= MATCHED_THRESHOLD ? 'matched' : bestRatio >= PARTIAL_THRESHOLD ? 'partial' : 'missing'
    const evidence = status !== 'missing' && best ? [best.bullet.evidence(Math.round(bestRatio * 100) / 100)] : []

    return { responsibility, status, evidence }
  })
}

import type { RecommendationCategory } from './types'

/**
 * Rough, deterministic point estimates shown as each recommendation's
 * potential impact (e.g. "ATS relevance +4" in the product brief). Product
 * configuration, not a guarantee of any real-world outcome — see the "no
 * guaranteed interview claims" principle in docs/product/v1-scope.md.
 */
export const RECOMMENDATION_IMPACT: Record<RecommendationCategory, { metric: string; delta: number }> = {
  'bullet-impact': { metric: 'Content Quality', delta: 3 },
  'skill-not-demonstrated': { metric: 'Required Skills', delta: 6 },
  'skill-evidence': { metric: 'Skills Evidence', delta: 2 },
  'missing-section': { metric: 'Sections', delta: 5 },
  formatting: { metric: 'Formatting', delta: 4 },
  'title-alignment': { metric: 'Title', delta: 3 },
  // A failed hard requirement is the highest-impact category by design —
  // it's a pass/fail gate the spec says must never be hidden (§29).
  'hard-requirement-gap': { metric: 'Hard Requirements', delta: 8 },
  'experience-gap': { metric: 'Experience', delta: 5 },
  'responsibility-gap': { metric: 'Responsibility Alignment', delta: 4 },
  'education-gap': { metric: 'Education', delta: 3 },
}

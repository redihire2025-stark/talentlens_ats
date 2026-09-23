/**
 * Which part of the resume a piece of evidence was taken from. Languages
 * and awards (which have no dedicated value here) use `'other'`, as does
 * anything that isn't tied to one resume section.
 */
export type EvidenceSection =
  | 'contact'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'other'

/**
 * `explicit` — `text` is a verbatim quote from the resume (a bullet, a
 * skills-list line, a header line). This is nearly all evidence.
 *
 * `inferred-from-structure` — there's no single literal quote to point at;
 * the fact was inferred from the resume's structure instead (e.g. "3
 * experience entries were detected"). `text` then describes the structural
 * observation rather than quoting the resume. Use this only when no literal
 * quote exists.
 */
export type EvidenceSourceType = 'explicit' | 'inferred-from-structure'

/**
 * A typed pointer back to the resume content that supports a claim (a
 * skill, a match, a recommendation, a score component). The spec's
 * "Evidence First" principle (docs/product/ats-engine-spec.md §1): nothing
 * is claimed about a candidate without one of these behind it.
 */
export interface Evidence {
  text: string
  section: EvidenceSection
  /** The `id` of the resume entry (experience/education/certification/project entry, or a skill) the text came from, when there is one. */
  entryId?: string
  sourceType: EvidenceSourceType
  /** 0-1. 1 for a verbatim quote; lower when the link between the text and the claim is looser (e.g. a fuzzy match). */
  confidence: number
}

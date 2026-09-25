import { coerceAiParsedResume, type AiParsedResume } from './parseResumePrompt'

/**
 * Grounding / verification layer for AI-assisted resume parsing.
 *
 * WHY THIS EXISTS: the product spec's core rule is that nothing about a
 * candidate may be invented (docs/product/ats-engine-spec.md — "never invent
 * candidate information", "AI must never determine whether a skill
 * exists"). Using an LLM to help parse resumes (a later, explicit product
 * decision — see docs/architecture/resume-parser.md) would break that rule
 * if its output were trusted. So nothing it returns is trusted: every
 * string value must appear VERBATIM in the resume's own extracted text, or
 * it is dropped. The model can therefore only *locate and label* text that
 * is already there — it can decide which verbatim span is a job title vs a
 * company, but it cannot add a skill, a metric, a date, an employer, or a
 * word that the candidate didn't write.
 *
 * Matching rules (deliberately strict):
 * - Case-insensitive, and all whitespace runs (spaces, tabs, line breaks)
 *   collapse to one space on both sides — so a bullet wrapped across two
 *   extracted lines, or "JANE DOE" vs "Jane Doe", still verifies.
 * - Nothing else is forgiven: a changed word, added number, reworded
 *   phrase, corrected typo or expanded abbreviation fails.
 * - Token boundaries: a match must not start or end in the middle of a
 *   word, so "Go" is not "verified" by "Google" and "Java" is not verified
 *   by "JavaScript".
 *
 * A kept value is replaced by the source text's own span for it, so even
 * casing comes from the resume, never from the model.
 *
 * Pure and deterministic: same (response, text) in, same result out.
 */

export interface GroundingResult {
  /**
   * Only values that verified against the source text — and each one is the
   * source's own spelling of it (see `sourceSpan`), not the model's copy.
   * Safe to merge into a Resume.
   */
  data: AiParsedResume
  /** Field paths (never values — no resume content) of everything that was dropped, e.g. `skills[3]`, `experience[0].bullets[2]`. */
  rejected: string[]
}

interface NormalizedText {
  /** Lowercased, whitespace runs collapsed to one space, trimmed. */
  text: string
  /** `map[i]` is the index in the original string of normalized character `i`'s first code unit. */
  map: number[]
  /** `ends[i]` is the index just past normalized character `i`'s last code unit in the original string. */
  ends: number[]
}

function normalizeWithMap(input: string): NormalizedText {
  let text = ''
  const map: number[] = []
  const ends: number[] = []
  let offset = 0
  for (const ch of input) {
    const start = offset
    offset += ch.length
    if (/\s/.test(ch)) {
      if (text.length > 0 && text[text.length - 1] !== ' ') {
        text += ' '
        map.push(start)
        ends.push(offset)
      }
      continue
    }
    // Lowercasing can change a character's length (e.g. "İ"); every code
    // unit it produces maps back to the same original character.
    for (const unit of ch.toLowerCase().split('')) {
      text += unit
      map.push(start)
      ends.push(offset)
    }
  }
  if (text.endsWith(' ')) {
    text = text.slice(0, -1)
    map.pop()
    ends.pop()
  }
  return { text, map, ends }
}

export function normalizeForGrounding(text: string): string {
  return normalizeWithMap(text).text
}

const WORD_CHAR_RE = /[\p{L}\p{N}]/u

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD_CHAR_RE.test(ch)
}

/** Every token-bounded occurrence of `value` in `source.text`, in document order. */
function findGroundedHits(value: string, source: NormalizedText): { index: number; length: number }[] {
  const needle = normalizeForGrounding(value)
  if (!needle) return []
  const haystack = source.text
  const needsStartBoundary = isWordChar(needle[0])
  const needsEndBoundary = isWordChar(needle[needle.length - 1])
  const hits: { index: number; length: number }[] = []

  let from = 0
  while (from <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, from)
    if (index === -1) break
    const startOk = !needsStartBoundary || !isWordChar(haystack[index - 1])
    const endOk = !needsEndBoundary || !isWordChar(haystack[index + needle.length])
    if (startOk && endOk) hits.push({ index, length: needle.length })
    from = index + 1
  }
  return hits
}

/**
 * The resume's OWN text for a grounded value — the literal source span it
 * matched, with internal whitespace runs collapsed to single spaces — or
 * null when `value` doesn't appear verbatim. Returning the source's span
 * rather than the model's copy means every value that reaches a Resume is
 * literally a slice of what the candidate wrote, down to its casing. When
 * the value occurs more than once, an occurrence with the exact same casing
 * is preferred; otherwise the first occurrence is used.
 */
function sourceSpan(value: string, source: NormalizedText, original: string): string | null {
  const hits = findGroundedHits(value, source)
  if (hits.length === 0) return null
  const spans = hits.map((hit) => original.slice(source.map[hit.index]!, source.ends[hit.index + hit.length - 1]!).replace(/\s+/g, ' '))
  const exact = value.trim().replace(/\s+/g, ' ')
  return spans.find((span) => span === exact) ?? spans[0]!
}

/** Public single-value check: does `value` appear verbatim (case/whitespace-insensitive, token-bounded) in `sourceText`? */
export function isGroundedInSource(value: string, sourceText: string): boolean {
  return findGroundedHits(value, normalizeWithMap(sourceText)).length > 0
}

/** The source text's own spelling of `value` (see `sourceSpan`), or null when it isn't grounded. */
export function locateInSource(value: string, sourceText: string): string | null {
  return sourceSpan(value, normalizeWithMap(sourceText), sourceText)
}

/**
 * The first trimmed source line containing `value` (same matching rules),
 * for use as verbatim evidence. When `value` only matches across a line
 * break (a wrapped bullet), returns `value` itself — still a verbatim quote.
 */
export function findSourceLine(sourceText: string, value: string): string {
  for (const rawLine of sourceText.split('\n')) {
    const line = rawLine.trim()
    if (line && findGroundedHits(value, normalizeWithMap(line)).length > 0) return line
  }
  return value.trim()
}

/**
 * Verifies every string in an AI extraction against the resume's own text
 * and returns only what verified. Accepts the raw (untyped) response and
 * shape-coerces it first, so a malformed response can't smuggle anything
 * through either.
 *
 * Entry-level rule: an experience entry survives only if its title or
 * company verified; education needs a verified institution; certifications
 * and projects need a verified name. An entry whose anchor was invented is
 * dropped with everything under it, even if some of its bullets happen to
 * verify — otherwise real bullets could be attached to a fabricated job.
 */
export function groundAiExtraction(raw: unknown, sourceText: string): GroundingResult {
  const ai = coerceAiParsedResume(raw)
  const source = normalizeWithMap(sourceText)
  const rejected: string[] = []

  const keep = (value: string | null, path: string): string | null => {
    if (value === null) return null
    const span = sourceSpan(value, source, sourceText)
    if (span !== null) return span
    rejected.push(path)
    return null
  }

  const keepList = (values: string[], path: string): string[] => {
    const out: string[] = []
    const seen = new Set<string>()
    values.forEach((value, i) => {
      const kept = keep(value, `${path}[${i}]`)
      if (kept === null) return
      const key = normalizeForGrounding(kept)
      if (seen.has(key)) return
      seen.add(key)
      out.push(kept)
    })
    return out
  }

  const dropEntry = (path: string) => {
    rejected.push(path)
    return null
  }

  const experience = ai.experience
    .map((entry, i) => {
      const p = `experience[${i}]`
      const title = keep(entry.title, `${p}.title`)
      const company = keep(entry.company, `${p}.company`)
      if (title === null && company === null) return dropEntry(p)
      return {
        title,
        company,
        location: keep(entry.location, `${p}.location`),
        startDate: keep(entry.startDate, `${p}.startDate`),
        endDate: keep(entry.endDate, `${p}.endDate`),
        bullets: keepList(entry.bullets, `${p}.bullets`),
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const education = ai.education
    .map((entry, i) => {
      const p = `education[${i}]`
      const institution = keep(entry.institution, `${p}.institution`)
      if (institution === null) return dropEntry(p)
      return {
        institution,
        degree: keep(entry.degree, `${p}.degree`),
        fieldOfStudy: keep(entry.fieldOfStudy, `${p}.fieldOfStudy`),
        location: keep(entry.location, `${p}.location`),
        startDate: keep(entry.startDate, `${p}.startDate`),
        endDate: keep(entry.endDate, `${p}.endDate`),
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const certifications = ai.certifications
    .map((entry, i) => {
      const p = `certifications[${i}]`
      const name = keep(entry.name, `${p}.name`)
      if (name === null) return dropEntry(p)
      return { name, issuer: keep(entry.issuer, `${p}.issuer`), date: keep(entry.date, `${p}.date`) }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  const projects = ai.projects
    .map((entry, i) => {
      const p = `projects[${i}]`
      const name = keep(entry.name, `${p}.name`)
      if (name === null) return dropEntry(p)
      return {
        name,
        description: keep(entry.description, `${p}.description`),
        url: keep(entry.url, `${p}.url`),
        bullets: keepList(entry.bullets, `${p}.bullets`),
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)

  return {
    data: {
      name: keep(ai.name, 'name'),
      email: keep(ai.email, 'email'),
      phone: keep(ai.phone, 'phone'),
      location: keep(ai.location, 'location'),
      links: keepList(ai.links, 'links'),
      summary: keep(ai.summary, 'summary'),
      skills: keepList(ai.skills, 'skills'),
      experience,
      education,
      certifications,
      projects,
    },
    rejected,
  }
}

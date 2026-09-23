import type { JobDescription, JobRequirement, RequirementPriority } from '@/types/jobDescription'
import { stripBulletMarker } from '../shared/lines'
import { splitJobDescriptionSections, type JdSections } from './sections'
import { buildSkillListItems } from './buildSkillList'
import { SKILL_SYNONYM_GROUPS, type SynonymGroup } from '@/lib/normalization/skillSynonyms'
import { SOFT_SKILL_GROUPS } from '@/lib/normalization/softSkillDictionary'
import { findTaxonomyMentions } from '@/lib/normalization/termMining'
import { normalizeSkillName } from '@/lib/normalization/skillDictionary'
import { hashText } from '@/lib/schema/ids'
import {
  PROSE_REQUIREMENT_CONFIDENCE,
  buildDomainTerms,
  buildJobRequirement,
  buildKeywords,
  emptyJobDescription,
} from '@/lib/schema/jdBuilders'
import {
  extractDomainTerms,
  extractEmploymentType,
  extractExperienceRequirement,
  extractLocation,
  extractSeniority,
  extractTitle,
} from './fieldExtractors'

/** Below this length, a "job description" is almost certainly a parsing failure or an unrelated document. */
export const MIN_JD_TEXT_LENGTH = 60

export interface ParsedJobDescriptionResult {
  jobDescription: JobDescription
  /** Same list as `jobDescription.parserWarnings`. */
  warnings: string[]
}

function linesToList(lines: string[]): string[] {
  return lines.map(stripBulletMarker).filter(Boolean)
}

/** "3+ years", "3-5 years", "3 years" — the minimum figure stated on one line. */
const LINE_YEARS_RE = /\b(\d{1,2})\s*(?:\+|(?:-|to)\s*\d{1,2}\+?)?\s*years?\b/i

function minimumYearsOnLine(line: string): number | undefined {
  const match = line.match(LINE_YEARS_RE)
  return match ? Number(match[1]) : undefined
}

const PREFERRED_LINE_RE = /\b(preferred|nice to have|a plus|bonus)\b/i

interface MinedTerm {
  canonical: string
  matchedText: string
  line: string
}

/**
 * Mines taxonomy terms line by line (so each term keeps the exact line it
 * came from as evidence), skipping any canonical term already in `found`
 * and adding every new one to it. Same conservative whole-word rules as
 * `findTaxonomyMentions` — see `termMining.ts`.
 */
function mineLines(lines: string[], dictionary: readonly SynonymGroup[], found: Set<string>): MinedTerm[] {
  const mined: MinedTerm[] = []
  for (const rawLine of lines) {
    const line = stripBulletMarker(rawLine)
    if (!line) continue
    for (const mention of findTaxonomyMentions(line, dictionary, { exclude: found })) {
      found.add(mention.canonical)
      mined.push({ ...mention, line })
    }
  }
  return mined
}

/**
 * A years figure stated on the *same line* as a requirement term ("5+
 * years of experience with React") is attached to that requirement — the
 * JD said it about that term, literally. Nothing is attached from a line
 * that doesn't mention the term.
 */
function attachStatedYears(requirements: JobRequirement[], sectionLines: string[]): JobRequirement[] {
  const linesWithYears = sectionLines.map(stripBulletMarker).filter((line) => minimumYearsOnLine(line) !== undefined)
  if (linesWithYears.length === 0) return requirements

  return requirements.map((requirement) => {
    if (requirement.minimumYears !== undefined) return requirement
    const line = linesWithYears.find(
      (l) =>
        findTaxonomyMentions(l, SKILL_SYNONYM_GROUPS).some((m) => m.canonical === requirement.canonicalTerm) ||
        new RegExp(`(^|[^\\w])${requirement.rawText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w])`, 'i').test(l),
    )
    return line ? { ...requirement, minimumYears: minimumYearsOnLine(line)! } : requirement
  })
}

/**
 * A requirements/preferred section's skills: comma/pipe list items first
 * (confidence 1), then taxonomy terms mined from that section's prose
 * (confidence 0.8). `found` (canonical terms) prevents duplicates across
 * both sections.
 */
function buildSectionSkills(sectionLines: string[], priority: RequirementPriority, found: Set<string>): JobRequirement[] {
  const idPrefix = `req-${priority}`
  const requirements: JobRequirement[] = []

  for (const item of buildSkillListItems(sectionLines)) {
    const canonical = normalizeSkillName(item.name)
    if (found.has(canonical)) continue
    found.add(canonical)
    requirements.push(
      buildJobRequirement({ rawText: item.name, category: 'skill', priority, evidence: item.line }, `${idPrefix}-${requirements.length}`),
    )
  }

  for (const mined of mineLines(sectionLines, SKILL_SYNONYM_GROUPS, found)) {
    requirements.push(
      buildJobRequirement(
        {
          rawText: mined.matchedText,
          canonicalTerm: mined.canonical,
          category: 'skill',
          priority,
          confidence: PROSE_REQUIREMENT_CONFIDENCE,
          evidence: mined.line,
        },
        `${idPrefix}-${requirements.length}`,
      ),
    )
  }

  return attachStatedYears(requirements, sectionLines)
}

/** A soft skill stated in the requirements section is `required`, in the preferred section `preferred`; mentioned anywhere else, `optional`. */
function sectionPriority(line: string, sections: JdSections): RequirementPriority {
  if (sections.requiredSkills.map(stripBulletMarker).includes(line)) return 'required'
  if (sections.preferredSkills.map(stripBulletMarker).includes(line)) return 'preferred'
  return 'optional'
}

/** Education/certification lines are kept whole (they're prose, compared by overlap), typed as requirements so a hard requirement can point back to them. */
function buildLineRequirements(lines: string[], category: 'education' | 'certification', idPrefix: string): JobRequirement[] {
  return linesToList(lines).map((line, index) =>
    buildJobRequirement({ rawText: line, category, priority: PREFERRED_LINE_RE.test(line) ? 'preferred' : 'required' }, `${idPrefix}-${index}`),
  )
}

/**
 * Deterministic, rule-based text → JobDescription conversion — the JD
 * counterpart to `parseResumeText` (see docs/architecture/resume-parser.md
 * for the shared design philosophy). No network calls, no LLM, no clock.
 * See docs/architecture/jd-schema.md for how each typed requirement's
 * `priority`, `confidence`, and `evidence` are decided.
 */
export function parseJobDescriptionText(rawText: string): ParsedJobDescriptionResult {
  const warnings: string[] = []
  const trimmed = rawText.trim()

  if (trimmed.length === 0) {
    warnings.push('No text could be extracted from this document.')
    return { jobDescription: emptyJobDescription({ id: `jd-${hashText('')}`, parserWarnings: [...warnings] }), warnings }
  }
  if (trimmed.length < MIN_JD_TEXT_LENGTH) {
    warnings.push('This document is very short for a job description — parsing may be incomplete.')
  }

  const sections = splitJobDescriptionSections(trimmed)

  // Flagship JD-parser fix (PRD §9): mine skill mentions out of prose lines
  // too, not just comma/pipe/list lines — conservatively, via the same
  // synonym dictionary the matching engine already trusts. Requirement-
  // section prose is mined into requiredSkills; preferred-section prose
  // into preferredSkills; everything else (responsibilities, overview) is
  // kept separate as `technologies` (`priority: 'optional'`), since it's a
  // *mention*, not necessarily a stated requirement (see
  // docs/scoring/matching-rules.md's "don't penalize for what the JD never
  // asked for").
  const foundSkills = new Set<string>()
  const requiredSkills = buildSectionSkills(sections.requiredSkills, 'required', foundSkills)
  const preferredSkills = buildSectionSkills(sections.preferredSkills, 'preferred', foundSkills)

  const bodyLines = [...sections.header, ...sections.responsibilities, ...sections.education, ...sections.certifications]
  const technologies = mineLines(bodyLines, SKILL_SYNONYM_GROUPS, foundSkills).map((mined, index) =>
    buildJobRequirement(
      {
        rawText: mined.matchedText,
        canonicalTerm: mined.canonical,
        category: 'technology',
        priority: 'optional',
        confidence: PROSE_REQUIREMENT_CONFIDENCE,
        evidence: mined.line,
      },
      `tech-${index}`,
    ),
  )

  const softSkills = mineLines(trimmed.split('\n'), SOFT_SKILL_GROUPS, new Set()).map((mined, index) =>
    buildJobRequirement(
      {
        rawText: mined.matchedText,
        canonicalTerm: mined.canonical,
        category: 'soft-skill',
        priority: sectionPriority(mined.line, sections),
        confidence: PROSE_REQUIREMENT_CONFIDENCE,
        evidence: mined.line,
      },
      `soft-${index}`,
    ),
  )

  const keywordExcludeSet = new Set(
    [...requiredSkills, ...preferredSkills, ...technologies].flatMap((r) => [r.canonicalTerm, r.rawText.toLowerCase()]),
  )
  const domainTerms = buildDomainTerms(extractDomainTerms(trimmed, keywordExcludeSet))

  const title = extractTitle(sections.header)

  const jobDescription: JobDescription = {
    id: `jd-${hashText(trimmed)}`,
    title,
    seniority: extractSeniority(title, trimmed),
    experience: extractExperienceRequirement(trimmed),
    requiredSkills,
    preferredSkills,
    responsibilities: linesToList(sections.responsibilities),
    education: buildLineRequirements(sections.education, 'education', 'edu'),
    certifications: buildLineRequirements(sections.certifications, 'certification', 'cert'),
    location: extractLocation(trimmed),
    employmentType: extractEmploymentType(trimmed),
    keywords: buildKeywords(requiredSkills, preferredSkills),
    technologies,
    softSkills,
    domainTerms,
    parserWarnings: [],
    rawText: trimmed,
  }

  if (jobDescription.requiredSkills.length === 0 && jobDescription.preferredSkills.length === 0) {
    warnings.push('No clearly listed skills were found — look for a "Requirements" or "Skills" section.')
  }
  if (jobDescription.responsibilities.length === 0) {
    warnings.push('No responsibilities section was detected.')
  }

  return { jobDescription: { ...jobDescription, parserWarnings: [...warnings] }, warnings }
}

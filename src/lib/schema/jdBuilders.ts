import type { JobDescription, JobRequirement, Keyword, RequirementCategory, RequirementPriority } from '@/types/jobDescription'
import { normalizeSkillName } from '@/lib/normalization/skillDictionary'
import { normalizeKeyword } from '@/lib/normalization/keywordNormalization'

/** Stated in a comma/pipe list or on its own line — the JD said this, literally. */
export const LISTED_REQUIREMENT_CONFIDENCE = 1
/** Mined from prose via the taxonomy — a real whole-word mention, but whether it's a firm requirement is read from context (the section it's in). */
export const PROSE_REQUIREMENT_CONFIDENCE = 0.8

/** How each category's `canonicalTerm` is derived: skill-like terms go through the skill dictionary; everything else is plain keyword normalization. */
export function canonicalTermFor(rawText: string, category: RequirementCategory): string {
  switch (category) {
    case 'skill':
    case 'technology':
    case 'keyword':
      return normalizeSkillName(rawText)
    default:
      return normalizeKeyword(rawText)
  }
}

export interface JobRequirementInput {
  rawText: string
  category: RequirementCategory
  priority: RequirementPriority
  canonicalTerm?: string
  confidence?: number
  minimumYears?: number
  evidence?: string
}

export function buildJobRequirement(input: JobRequirementInput, id: string): JobRequirement {
  const rawText = input.rawText.trim()
  return {
    id,
    rawText,
    canonicalTerm: input.canonicalTerm ?? canonicalTermFor(rawText, input.category),
    category: input.category,
    priority: input.priority,
    ...(input.minimumYears !== undefined ? { minimumYears: input.minimumYears } : {}),
    ...(input.evidence !== undefined && input.evidence !== rawText ? { evidence: input.evidence } : {}),
    confidence: input.confidence ?? LISTED_REQUIREMENT_CONFIDENCE,
  }
}

/** Convenience for a plain list of names (tests, fixtures): each becomes a listed requirement with id `<idPrefix>-<index>`. */
export function buildJobRequirements(
  names: string[],
  options: { category: RequirementCategory; priority: RequirementPriority; idPrefix: string },
): JobRequirement[] {
  return names.map((rawText, index) =>
    buildJobRequirement({ rawText, category: options.category, priority: options.priority }, `${options.idPrefix}-${index}`),
  )
}

/**
 * The keyword set is the distinct (by canonical term) union of required
 * then preferred skills — so a skill stated in both lists, or twice under
 * different spellings, counts once, never rewarding repetition (spec §27).
 */
export function buildKeywords(required: JobRequirement[], preferred: JobRequirement[]): Keyword[] {
  const seen = new Set<string>()
  const keywords: Keyword[] = []
  for (const requirement of [...required, ...preferred]) {
    if (seen.has(requirement.canonicalTerm)) continue
    seen.add(requirement.canonicalTerm)
    keywords.push({ ...requirement, id: `kw-${keywords.length}`, category: 'keyword' })
  }
  return keywords
}

export function buildDomainTerms(terms: string[]): Keyword[] {
  return terms.map((rawText, index) => ({
    id: `domain-${index}`,
    rawText,
    canonicalTerm: normalizeKeyword(rawText),
    category: 'domain',
    priority: 'optional',
    confidence: LISTED_REQUIREMENT_CONFIDENCE,
  }))
}

/** An empty, schema-complete JobDescription. */
export function emptyJobDescription(overrides: Partial<JobDescription> = {}): JobDescription {
  return {
    id: 'jd-empty',
    title: null,
    seniority: null,
    experience: { minimumYears: null, maximumYears: null },
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    education: [],
    certifications: [],
    location: null,
    employmentType: null,
    keywords: [],
    technologies: [],
    softSkills: [],
    domainTerms: [],
    parserWarnings: [],
    rawText: '',
    ...overrides,
  }
}

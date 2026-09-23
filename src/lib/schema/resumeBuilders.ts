import type {
  AwardEntry,
  CertificationEntry,
  ContactInformation,
  EducationEntry,
  ExperienceBullet,
  ExperienceEntry,
  ExperienceType,
  LanguageEntry,
  ProjectEntry,
  Resume,
  ResumeSkill,
  SkillCategory,
  SkillSource,
} from '@/types/resume'
import type { Evidence } from '@/types/evidence'
import type { Nullable } from '@/types/common'
import { SKILL_SYNONYM_GROUPS, SKILL_TAXONOMY_VERSION } from '@/lib/normalization/skillSynonyms'
import { normalizeSkillName } from '@/lib/normalization/skillDictionary'
import { normalizeTitle } from '@/lib/normalization/normalizeTitle'
import { AMBIGUOUS_PROSE_VARIANTS, findTaxonomyMentions } from '@/lib/normalization/termMining'
import { leadingActionVerb, stripWeakLeadIn } from '@/lib/ats/bulletQuality'
import { dedupeEvidence, explicitEvidence } from './evidence'
import { extractMetrics } from './metrics'

/**
 * Canonical-schema construction helpers — the one place that knows how to
 * turn plain extracted values into fully-populated `Resume` entities (ids,
 * typed evidence, derived fields). The resume parser, the editor's edit
 * functions (`applyEdits.ts`), and test fixtures all build entities through
 * here, so a bullet parsed from a PDF and a bullet typed into the editor
 * always get exactly the same derived fields. Every function is pure and
 * deterministic: ids are positional or content-derived, never random.
 */

/** Recorded on every parsed Resume (`parserMetadata.parserVersion`). Bump when parser output shape or rules change. */
export const RESUME_PARSER_VERSION = '2.0.0'

// ---------------------------------------------------------------------------
// Skills

/** Other known spellings of a canonical skill from the taxonomy, excluding the one actually written. */
export function taxonomyAliasesFor(canonicalName: string, rawName: string): string[] {
  const group = SKILL_SYNONYM_GROUPS.find((g) => g.canonical === canonicalName)
  if (!group) return []
  const rawLower = rawName.trim().toLowerCase()
  return group.variants.filter((variant) => variant !== rawLower)
}

export interface ResumeSkillInput {
  rawName: string
  category?: SkillCategory
  /** The literal skills-list line this skill came from. Defaults to the skill name itself (e.g. a skill typed into the editor's skills list). */
  sourceLine?: string
}

/** A skill as it appears in the resume's skills list (`sources: ['skills-section']`). Bullet evidence is attached separately by `linkSkillEvidence`. */
export function buildResumeSkill(input: ResumeSkillInput, index: number): ResumeSkill {
  const id = `skill-${index}`
  const rawName = input.rawName.trim()
  const canonicalName = normalizeSkillName(rawName)
  return {
    id,
    rawName,
    canonicalName,
    category: input.category ?? 'other',
    aliases: taxonomyAliasesFor(canonicalName, rawName),
    evidence: [explicitEvidence(input.sourceLine ?? rawName, 'skills', id)],
    confidence: 1,
    sources: ['skills-section'],
  }
}

/**
 * Whether a skill is mentioned in some lowercased text — by canonical name
 * or by the exact name the resume lists. Substring (not whole-word) on
 * purpose: it's the long-standing rule `splitSkillsByEvidence` uses, kept
 * identical so skill evidence and the Skills & Evidence score always agree.
 */
export function skillMentionedIn(skill: Pick<ResumeSkill, 'rawName' | 'canonicalName'>, lowerText: string): boolean {
  return lowerText.includes(skill.canonicalName) || lowerText.includes(skill.rawName.toLowerCase())
}

/**
 * Recomputes every listed skill's bullet-derived evidence and `sources`
 * from the resume's *current* bullets, keeping the skills-list evidence
 * as-is. Run by the parser, and again after every editor change, so skill
 * evidence never points at a bullet that has since been rewritten.
 */
export function linkSkillEvidence(resume: Resume): Resume {
  const skills = resume.skills.map((skill) => {
    const listed = skill.evidence.filter((e) => e.section === 'skills')
    const fromExperience: Evidence[] = []
    const fromProjects: Evidence[] = []

    for (const entry of resume.experience) {
      for (const bullet of entry.bullets) {
        if (skillMentionedIn(skill, bullet.text.toLowerCase())) fromExperience.push(explicitEvidence(bullet.text, 'experience', entry.id))
      }
    }
    for (const project of resume.projects) {
      for (const bullet of project.bullets) {
        if (skillMentionedIn(skill, bullet.toLowerCase())) fromProjects.push(explicitEvidence(bullet, 'projects', project.id))
      }
    }

    const sources: SkillSource[] = [
      ...(listed.length > 0 ? (['skills-section'] as const) : []),
      ...(fromExperience.length > 0 ? (['experience'] as const) : []),
      ...(fromProjects.length > 0 ? (['projects'] as const) : []),
    ]
    return { ...skill, evidence: dedupeEvidence([...listed, ...fromExperience, ...fromProjects]), sources }
  })
  return { ...resume, skills }
}

/** `buildResumeSkill` over a list, with positional ids. */
export function buildResumeSkills(inputs: ResumeSkillInput[]): ResumeSkill[] {
  return inputs.map((input, index) => buildResumeSkill(input, index))
}

/** Re-assigns positional skill ids (`skill-0`, …) after the list changes, keeping each skill's evidence `entryId` in step with its new id. */
export function reindexSkills(skills: ResumeSkill[]): ResumeSkill[] {
  return skills.map((skill, index) => {
    const id = `skill-${index}`
    if (skill.id === id) return skill
    return {
      ...skill,
      id,
      evidence: skill.evidence.map((e) => (e.section === 'skills' && e.entryId === skill.id ? { ...e, entryId: id } : e)),
    }
  })
}

// ---------------------------------------------------------------------------
// Experience

/** Outcome-verb openers: a bullet that starts with one states a result, not just a duty. */
const OUTCOME_VERB_RE =
  /^(increased|reduced|improved|grew|saved|cut|boosted|achieved|won|doubled|tripled|accelerated|decreased|exceeded|generated|lowered|raised|eliminated)\b/i

/**
 * Builds a fully-derived bullet entity from its text. Everything is
 * extracted from `text` alone — never inferred beyond it:
 *
 * - `actionVerb` — the opener, when it's on the recognized action-verb list.
 * - `metrics` — every number-bearing phrase, verbatim (`extractMetrics`).
 * - `technologies` — taxonomy skills mentioned by name (whole-word; common-
 *   English variants like "rest"/"next" skipped — see `termMining.ts`).
 * - `achievements` — `[text]` when the bullet states a metric or opens with
 *   an outcome verb; `responsibilities` — otherwise, the bullet with any weak
 *   lead-in ("Responsible for") stripped. Exactly one of the two is set.
 */
export function buildExperienceBullet(text: string, entryId: string, index: number): ExperienceBullet {
  const id = `${entryId}-bullet-${index}`
  const trimmed = text.trim()
  const metrics = extractMetrics(trimmed)
  const actionVerb = leadingActionVerb(trimmed)

  const technologies: ResumeSkill[] = findTaxonomyMentions(trimmed, SKILL_SYNONYM_GROUPS, { skipVariants: AMBIGUOUS_PROSE_VARIANTS }).map(
    (mention, techIndex) => ({
      id: `${id}-tech-${techIndex}`,
      rawName: mention.matchedText,
      canonicalName: mention.canonical,
      category: 'other',
      aliases: taxonomyAliasesFor(mention.canonical, mention.matchedText),
      evidence: [explicitEvidence(trimmed, 'experience', entryId)],
      confidence: 1,
      sources: ['experience'],
    }),
  )

  const isAchievement = metrics.length > 0 || OUTCOME_VERB_RE.test(trimmed)

  return {
    id,
    text: trimmed,
    ...(actionVerb ? { actionVerb } : {}),
    metrics,
    technologies,
    responsibilities: isAchievement ? [] : [stripWeakLeadIn(trimmed)],
    achievements: isAchievement ? [trimmed] : [],
    evidence: [explicitEvidence(trimmed, 'experience', entryId)],
  }
}

const EXPERIENCE_TYPE_PATTERNS: [pattern: RegExp, type: ExperienceType][] = [
  [/\bintern(?:ship)?\b/i, 'internship'],
  [/\bfreelanc(?:e|er|ing)\b/i, 'freelance'],
  [/\bvolunteer(?:ing)?\b/i, 'volunteer'],
  [/\bcontract(?:or)?\b/i, 'contract'],
  [/\bpart[\s-]?time\b/i, 'part-time'],
  [/\bfull[\s-]?time\b/i, 'full-time'],
]

/** Reads an employment type only from what the entry's own meta text states; `unspecified` otherwise (never assumed full-time). */
export function detectExperienceType(metaText: string): ExperienceType {
  for (const [pattern, type] of EXPERIENCE_TYPE_PATTERNS) {
    if (pattern.test(metaText)) return type
  }
  return 'unspecified'
}

export interface ExperienceEntryInput {
  company: string
  title: string
  startDate: Nullable<string>
  endDate: Nullable<string>
  location: Nullable<string>
  bullets: string[]
  /** Set by the parser only when the text literally says "Present"/"Current"/"Now". */
  isCurrent?: boolean
  /** The literal title/company/date line(s). Defaults to the title and company as currently written (for entries built outside the parser, e.g. edited in the editor). */
  metaLines?: string[]
  warnings?: string[]
}

export function buildExperienceEntry(input: ExperienceEntryInput, index: number): ExperienceEntry {
  const id = `exp-${index}`
  const bullets = input.bullets.map((text, bulletIndex) => buildExperienceBullet(text, id, bulletIndex))
  const metaLines = input.metaLines ?? [[input.title, input.company].filter(Boolean).join(', ')].filter(Boolean)

  const technologies: string[] = []
  for (const bullet of bullets) {
    for (const tech of bullet.technologies) {
      if (!technologies.includes(tech.canonicalName)) technologies.push(tech.canonicalName)
    }
  }

  return {
    id,
    company: input.company,
    title: input.title,
    normalizedJobTitle: normalizeTitle(input.title).coreTitle,
    startDate: input.startDate,
    endDate: input.endDate,
    isCurrent: input.isCurrent ?? false,
    location: input.location,
    bullets,
    technologies,
    experienceType: detectExperienceType(metaLines.join(' ')),
    evidence: metaLines.map((line) => explicitEvidence(line, 'experience', id)),
    warnings: input.warnings ?? [],
  }
}

/** `buildExperienceEntry` over a list, with positional ids (`exp-0`, `exp-1`, …). */
export function buildExperienceEntries(inputs: ExperienceEntryInput[]): ExperienceEntry[] {
  return inputs.map((input, index) => buildExperienceEntry(input, index))
}

/** Rebuilds an entry after a field edit (title/company/bullet text) so every derived field stays consistent with the new text. Keeps the parsed meta-line evidence unless the title/company changed. */
export function rebuildExperienceEntry(entry: ExperienceEntry, changes: Partial<Pick<ExperienceEntry, 'title' | 'company'>> & { bullets?: string[] }, index: number): ExperienceEntry {
  const title = changes.title ?? entry.title
  const company = changes.company ?? entry.company
  const metaChanged = title !== entry.title || company !== entry.company
  return buildExperienceEntry(
    {
      company,
      title,
      startDate: entry.startDate,
      endDate: entry.endDate,
      location: entry.location,
      bullets: changes.bullets ?? entry.bullets.map((b) => b.text),
      isCurrent: entry.isCurrent,
      metaLines: metaChanged ? undefined : entry.evidence.map((e) => e.text),
      warnings: entry.warnings,
    },
    index,
  )
}

// ---------------------------------------------------------------------------
// Other sections

export interface EducationEntryInput {
  institution: string
  degree: Nullable<string>
  fieldOfStudy: Nullable<string>
  startDate: Nullable<string>
  endDate: Nullable<string>
  location: Nullable<string>
  sourceLines?: string[]
}

export function buildEducationEntry(input: EducationEntryInput, index: number): EducationEntry {
  const id = `edu-${index}`
  const lines = input.sourceLines ?? [[input.institution, input.degree, input.fieldOfStudy].filter(Boolean).join(', ')].filter(Boolean)
  const { sourceLines: _sourceLines, ...fields } = input
  return { id, ...fields, evidence: lines.map((line) => explicitEvidence(line, 'education', id)) }
}

export function buildEducationEntries(inputs: EducationEntryInput[]): EducationEntry[] {
  return inputs.map((input, index) => buildEducationEntry(input, index))
}

export interface CertificationEntryInput {
  name: string
  issuer: Nullable<string>
  issueDate: Nullable<string>
  expirationDate: Nullable<string>
  sourceLine?: string
}

export function buildCertificationEntry(input: CertificationEntryInput, index: number): CertificationEntry {
  const id = `cert-${index}`
  const { sourceLine, ...fields } = input
  return { id, ...fields, evidence: [explicitEvidence(sourceLine ?? input.name, 'certifications', id)] }
}

export function buildCertificationEntries(inputs: CertificationEntryInput[]): CertificationEntry[] {
  return inputs.map((input, index) => buildCertificationEntry(input, index))
}

export interface ProjectEntryInput {
  name: string
  description: Nullable<string>
  bullets: string[]
  technologies: string[]
  url: Nullable<string>
  sourceLines?: string[]
}

export function buildProjectEntry(input: ProjectEntryInput, index: number): ProjectEntry {
  const id = `proj-${index}`
  const { sourceLines, ...fields } = input
  const lines = sourceLines ?? [input.name]
  return { id, ...fields, evidence: lines.map((line) => explicitEvidence(line, 'projects', id)) }
}

export function buildProjectEntries(inputs: ProjectEntryInput[]): ProjectEntry[] {
  return inputs.map((input, index) => buildProjectEntry(input, index))
}

export function buildLanguageEntry(input: { name: string; proficiency: Nullable<string>; sourceLine: string }, index: number): LanguageEntry {
  const id = `lang-${index}`
  return { id, name: input.name, proficiency: input.proficiency, evidence: [explicitEvidence(input.sourceLine, 'other', id)] }
}

export function buildAwardEntry(
  input: { title: string; issuer: Nullable<string>; date: Nullable<string>; sourceLine: string },
  index: number,
): AwardEntry {
  const id = `award-${index}`
  return { id, title: input.title, issuer: input.issuer, date: input.date, evidence: [explicitEvidence(input.sourceLine, 'other', id)] }
}

export interface ContactInput {
  name: Nullable<string>
  email: Nullable<string>
  phone: Nullable<string>
  location: Nullable<string>
  links?: ContactInformation['links']
  /** The header lines the fields were extracted from — evidence quotes the line containing each field. Without them, evidence quotes the field value itself. */
  headerLines?: string[]
}

export function buildContactInformation(input: ContactInput): ContactInformation {
  const links = input.links ?? []
  const lines = (input.headerLines ?? []).map((line) => line.trim()).filter(Boolean)
  const values = [input.name, input.email, input.phone, input.location, ...links.map((l) => l.url)].filter((v): v is string => Boolean(v))

  const evidence = dedupeEvidence(
    values.map((value) => {
      const line = lines.find((l) => l.includes(value)) ?? value
      return explicitEvidence(line, 'contact')
    }),
  )

  return { name: input.name, email: input.email, phone: input.phone, location: input.location, links, evidence }
}

// ---------------------------------------------------------------------------
// Whole resume

/** An empty, schema-complete Resume. `id`/`metadata` describe "no document"; the parser overwrites them. */
export function emptyResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'resume-empty',
    metadata: { sourceFormat: 'text', characterCount: 0, lineCount: 0 },
    contact: buildContactInformation({ name: null, email: null, phone: null, location: null }),
    summary: null,
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    awards: [],
    sections: [],
    parserWarnings: [],
    parserMetadata: { parser: 'talentlens-rule-based', parserVersion: RESUME_PARSER_VERSION, taxonomyVersion: SKILL_TAXONOMY_VERSION },
    ...overrides,
  }
}

import type { ISODateString, Nullable } from './common'
import type { Evidence } from './evidence'

/** Broad classification used to group skills for display and scoring. */
export type SkillCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'database'
  | 'platform'
  | 'tool'
  | 'methodology'
  | 'soft-skill'
  | 'other'

/** Where in the resume a skill was seen. A skill named in the skills list *and* in a bullet has both — the spec treats demonstrated skills as stronger evidence than listed-only ones. */
export type SkillSource = 'skills-section' | 'experience' | 'projects'

/**
 * A skill the candidate lists. `rawName` is exactly what the resume says
 * and is never discarded; `canonicalName` is the normalization engine's
 * canonical spelling ("React.js" → "react"). `evidence` holds typed
 * pointers to the literal resume text supporting the skill — always the
 * skills-list line it came from, plus any experience/project bullet that
 * also mentions it. Never invented.
 */
export interface ResumeSkill {
  /** Positional within one Resume snapshot (`skill-0`, `skill-1`, …) — deterministic, never random. */
  id: string
  rawName: string
  canonicalName: string
  category: SkillCategory
  /** Other known spellings of `canonicalName` from the skill taxonomy (`skillSynonyms.ts`), excluding `rawName` itself. Empty for a skill the taxonomy doesn't know. */
  aliases: string[]
  evidence: Evidence[]
  /** 1 for a skill literally listed in the resume — the only way a skill enters `Resume.skills`. */
  confidence: number
  sources: SkillSource[]
}

export type CandidateLinkType = 'linkedin' | 'github' | 'portfolio' | 'website' | 'other'

export interface CandidateLink {
  type: CandidateLinkType
  url: string
}

/**
 * Contact fields are nullable rather than required: a parser may fail to
 * confidently extract any of them from a given document, and guessing
 * would risk fabricating contact info. See docs/architecture/resume-schema.md.
 * `evidence` quotes the header line each extracted field came from.
 */
export interface ContactInformation {
  name: Nullable<string>
  email: Nullable<string>
  phone: Nullable<string>
  location: Nullable<string>
  links: CandidateLink[]
  evidence: Evidence[]
}

/** A number-bearing phrase in a bullet, quoted verbatim — never a computed or estimated figure. */
export interface MetricEvidence {
  /** The literal matched text, e.g. "35%", "$1.2M", "3x", "4 production applications". */
  text: string
  /** The leading numeric value of `text` as written ("$1.2M" → 1.2), not scaled. */
  value: number
  kind: 'percentage' | 'currency' | 'multiplier' | 'duration' | 'count'
}

/**
 * One experience bullet, as its own entity rather than a bare string. All
 * sub-fields are derived deterministically from `text` alone (see
 * `buildExperienceBullet` in `src/lib/schema/resumeBuilders.ts`), so
 * editing a bullet's text and rebuilding it always yields a consistent
 * entity.
 */
export interface ExperienceBullet {
  /** `<entryId>-bullet-<index>`, e.g. `exp-0-bullet-2`. */
  id: string
  text: string
  /** The bullet's opening word, lowercased, when it's on the recognized action-verb list; absent otherwise. */
  actionVerb?: string
  metrics: MetricEvidence[]
  /** Known skills (from the taxonomy) mentioned by name in this bullet — `rawName` is the literal spelling used. */
  technologies: ResumeSkill[]
  /** The bullet stated as a duty (lead-in like "Responsible for" stripped) when it reads as a responsibility rather than an outcome. */
  responsibilities: string[]
  /** The bullet text when it states a measurable or outcome-verb result ("Reduced…", "35%"). */
  achievements: string[]
  evidence: Evidence[]
}

/** Parsed from the role's own title/meta text only; `unspecified` when nothing in the text says. */
export type ExperienceType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance' | 'volunteer' | 'unspecified'

export interface ExperienceEntry {
  /** Positional: `exp-0`, `exp-1`, … */
  id: string
  company: string
  /** The spec's `jobTitle` — kept as `title` here (see docs/architecture/resume-schema.md). */
  title: string
  /** `normalizeTitle(title).coreTitle` — seniority stripped, synonyms collapsed ("Sr. Front-End Developer" → "frontend engineer"). */
  normalizedJobTitle: string
  startDate: Nullable<ISODateString>
  /** null means either ongoing (see `isCurrent`) or not stated. */
  endDate: Nullable<ISODateString>
  /** True only when the resume literally says "Present"/"Current"/"Now" — never assumed from a missing end date. */
  isCurrent: boolean
  location: Nullable<string>
  bullets: ExperienceBullet[]
  /** Canonical names of every technology mentioned across this entry's bullets, deduped, in first-mention order. */
  technologies: string[]
  experienceType: ExperienceType
  /** The entry's meta line(s) (title/company/dates), quoted. */
  evidence: Evidence[]
  /** Parser warnings specific to this entry (also included in `Resume.parserWarnings`). */
  warnings: string[]
}

export interface EducationEntry {
  /** Positional: `edu-0`, … */
  id: string
  institution: string
  degree: Nullable<string>
  fieldOfStudy: Nullable<string>
  startDate: Nullable<ISODateString>
  endDate: Nullable<ISODateString>
  location: Nullable<string>
  evidence: Evidence[]
}

export interface CertificationEntry {
  /** Positional: `cert-0`, … */
  id: string
  name: string
  issuer: Nullable<string>
  issueDate: Nullable<ISODateString>
  expirationDate: Nullable<ISODateString>
  evidence: Evidence[]
}

export interface ProjectEntry {
  /** Positional: `proj-0`, … */
  id: string
  name: string
  description: Nullable<string>
  /** Plain strings, unlike `ExperienceEntry.bullets` — see docs/architecture/resume-schema.md for why project bullets weren't promoted too. */
  bullets: string[]
  technologies: string[]
  url: Nullable<string>
  evidence: Evidence[]
}

/** A spoken/written language from a "Languages" section — never a programming language (those are routed to `skills`). */
export interface LanguageEntry {
  /** Positional: `lang-0`, … */
  id: string
  name: string
  /** e.g. "Native", "Fluent", "B2" — exactly as written, or null when not stated. */
  proficiency: Nullable<string>
  evidence: Evidence[]
}

export interface AwardEntry {
  /** Positional: `award-0`, … */
  id: string
  title: string
  issuer: Nullable<string>
  date: Nullable<ISODateString>
  evidence: Evidence[]
}

export type ResumeSectionType =
  | 'contact'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'awards'

/** One detected section, in document order — lets structural analysis see what the resume contains and in what order. */
export interface ResumeSection {
  /** `section-<order>` */
  id: string
  type: ResumeSectionType
  /** The literal header line as written ("WORK EXPERIENCE"), or null for the implicit contact/header block at the top. */
  heading: Nullable<string>
  /** 0-based position among detected sections. */
  order: number
  /** Non-blank content lines under this heading. */
  lineCount: number
}

/** Where the resume came from. Deliberately contains no timestamp — the same input must always produce the same Resume (spec §4). */
export interface ResumeMetadata {
  /** `text` when parsed from raw text (pasted, or a test) rather than an uploaded file. */
  sourceFormat: 'pdf' | 'docx' | 'text'
  /** Length of the trimmed extracted text. */
  characterCount: number
  /** Non-blank lines in the extracted text. */
  lineCount: number
}

/** Which parser (and taxonomy) produced this Resume — so a stored Resume can be traced back to the rules that built it. */
export interface ParserMetadata {
  parser: 'talentlens-rule-based'
  parserVersion: string
  /** `SKILL_TAXONOMY_VERSION` from `src/lib/normalization/skillSynonyms.ts` at parse time. */
  taxonomyVersion: string
  /**
   * Present only when the AI-assisted parsing fallback filled at least one
   * field the rule-based parser had flagged (see
   * docs/architecture/resume-parser.md). Absent on every resume the
   * rule-based parser handled on its own. Every filled value was verified
   * verbatim against the resume text before use (`groundAiExtraction.ts`).
   */
  aiAssist?: ParserAiAssist
}

export interface ParserAiAssist {
  /** Which fields came from the verified AI extraction, e.g. `skills`, `contact.email`, `experience.exp-1.company`. */
  filledFields: string[]
  /** How many values the model returned that were dropped for not appearing verbatim in the resume text. */
  rejectedCount: number
}

/**
 * The canonical, strongly-typed representation of a resume. Every later
 * stage (normalization, ATS analysis, matching, recommendations,
 * versioning, export) reads and writes this shape — see
 * docs/architecture/resume-schema.md for field-by-field rationale.
 */
export interface Resume {
  /** `resume-<hash of the extracted text>` — content-derived, so the same text always gets the same id. */
  id: string
  metadata: ResumeMetadata
  contact: ContactInformation
  summary: Nullable<string>
  skills: ResumeSkill[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
  certifications: CertificationEntry[]
  projects: ProjectEntry[]
  languages: LanguageEntry[]
  awards: AwardEntry[]
  sections: ResumeSection[]
  /** The parser's warnings — the same list `parseResumeText` also returns alongside the Resume. */
  parserWarnings: string[]
  parserMetadata: ParserMetadata
}

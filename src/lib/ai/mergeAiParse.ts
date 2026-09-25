import type { ContactInformation, ExperienceEntry, Resume, ResumeSkill } from '@/types/resume'
import {
  buildContactInformation,
  buildExperienceEntry,
  buildResumeSkill,
  linkSkillEvidence,
} from '@/lib/schema/resumeBuilders'
import { extractDateRange } from '@/lib/parsers/resume/dateUtils'
import { extractEmail, extractLinks, extractPhone } from '@/lib/parsers/resume/fieldExtractors'
import { findSourceLine, isGroundedInSource, locateInSource, normalizeForGrounding } from './groundAiExtraction'
import type { AiExperienceEntry, AiParsedResume } from './parseResumePrompt'

/**
 * Decides WHEN the AI-assisted parsing fallback runs, and merges its
 * (already grounded) output into the rule-based Resume. Both pure.
 *
 * The rule-based parser stays authoritative: the fallback only runs for a
 * resume whose parser warnings name a specific structural problem, and it
 * only fills exactly the fields those warnings are about — and only where
 * the rule-based parser left them empty. A field the rule-based parser
 * extracted without a warning is never overwritten.
 */

const NO_TEXT_WARNING_RE = /no text could be extracted/i
const CONTACT_WARNING_RE = /no email or phone number was found/i
const SKILLS_WARNING_RE = /no skills section was detected/i
const EXPERIENCE_WARNING_RE = /no work experience was detected/i
const ENTRY_META_WARNING_RE = /couldn't (separate the title from the company|identify a title or company)/i

export interface AiAssistTargets {
  /** "No email or phone number was found" — fill any contact field the parser left null. */
  contact: boolean
  /** "No skills section was detected" (and the skills list is empty). */
  skills: boolean
  /** "No work experience was detected" (and the experience list is empty). */
  experience: boolean
  /** Entries whose own warnings say the title and company couldn't be separated/identified. */
  experienceEntryIds: string[]
}

/** Which flagged fields the fallback may fill, read only from the rule-based parser's own warnings. */
export function aiAssistTargets(resume: Resume): AiAssistTargets {
  const warnings = resume.parserWarnings
  if (warnings.some((w) => NO_TEXT_WARNING_RE.test(w))) {
    return { contact: false, skills: false, experience: false, experienceEntryIds: [] }
  }
  return {
    contact: warnings.some((w) => CONTACT_WARNING_RE.test(w)),
    skills: resume.skills.length === 0 && warnings.some((w) => SKILLS_WARNING_RE.test(w)),
    experience: resume.experience.length === 0 && warnings.some((w) => EXPERIENCE_WARNING_RE.test(w)),
    experienceEntryIds: resume.experience
      .filter((entry) => entry.company === '' && entry.warnings.some((w) => ENTRY_META_WARNING_RE.test(w)))
      .map((entry) => entry.id),
  }
}

/** True only when the rule-based parser flagged at least one structural problem the fallback can address. A clean parse never triggers an AI call. */
export function needsAiAssist(targets: AiAssistTargets): boolean {
  return targets.contact || targets.skills || targets.experience || targets.experienceEntryIds.length > 0
}

const PRESENT_RE = /^(present|current|now)$/i

function isoDate(value: string | null): string | null {
  if (!value) return null
  return extractDateRange(value)?.startDate ?? null
}

function aiEntryDates(entry: AiExperienceEntry) {
  const isCurrent = entry.endDate !== null && PRESENT_RE.test(entry.endDate.trim())
  return { startDate: isoDate(entry.startDate), endDate: isCurrent ? null : isoDate(entry.endDate), isCurrent }
}

function uniqueLines(lines: string[]): string[] {
  return [...new Set(lines.map((l) => l.trim()).filter(Boolean))]
}

function mergeContact(contact: ContactInformation, ai: AiParsedResume, rawText: string, filled: string[]): ContactInformation {
  const name =
    contact.name ?? (ai.name && ai.name.length <= 60 && !ai.name.includes('@') && !extractPhone(ai.name) ? ai.name : null)
  const email = contact.email ?? (ai.email && extractEmail(ai.email) === ai.email ? ai.email : null)
  const phone = contact.phone ?? (ai.phone && extractPhone(ai.phone) && (ai.phone.match(/\d/g)?.length ?? 0) >= 7 ? ai.phone : null)
  const location = contact.location ?? (ai.location && ai.location.length <= 60 ? ai.location : null)
  const links =
    contact.links.length > 0
      ? contact.links
      : ai.links.flatMap((link) => extractLinks(link).filter((parsed) => parsed.url === link))

  const newValues: string[] = []
  const note = (field: string, before: unknown, after: string | null) => {
    if (before === null && after !== null) {
      filled.push(`contact.${field}`)
      newValues.push(after)
    }
  }
  note('name', contact.name, name)
  note('email', contact.email, email)
  note('phone', contact.phone, phone)
  note('location', contact.location, location)
  if (contact.links.length === 0 && links.length > 0) {
    filled.push('contact.links')
    newValues.push(...links.map((l) => l.url))
  }
  if (newValues.length === 0) return contact

  return buildContactInformation({
    name,
    email,
    phone,
    location,
    links,
    headerLines: uniqueLines([...contact.evidence.map((e) => e.text), ...newValues.map((v) => findSourceLine(rawText, v))]),
  })
}

function skillsFromAi(ai: AiParsedResume, rawText: string): ResumeSkill[] {
  return ai.skills
    .filter((name) => name.length <= 60)
    .map((rawName, index) => buildResumeSkill({ rawName, category: 'other', sourceLine: findSourceLine(rawText, rawName) }, index))
}

/** Evidence for an AI-filled entry: the one source line holding both its title and company when there is one, else each value's own line. */
function entryMetaLines(rawText: string, title: string | null, company: string | null): string[] {
  if (title && company) {
    const both = rawText
      .split('\n')
      .map((l) => l.trim())
      .find((line) => line && isGroundedInSource(title, line) && isGroundedInSource(company, line))
    if (both) return [both]
  }
  return uniqueLines([title, company].filter((v): v is string => v !== null).map((v) => findSourceLine(rawText, v)))
}

function experienceFromAi(ai: AiParsedResume, rawText: string): ExperienceEntry[] {
  return ai.experience.map((entry, index) =>
    buildExperienceEntry(
      {
        title: entry.title ?? '',
        company: entry.company ?? '',
        location: entry.location,
        ...aiEntryDates(entry),
        bullets: entry.bullets,
        metaLines: entryMetaLines(rawText, entry.title, entry.company),
        warnings: [],
      },
      index,
    ),
  )
}

/**
 * For an entry the rule-based parser couldn't split, finds an AI entry
 * whose title AND company both appear (verbatim) within that entry's own
 * meta line(s) — so the AI can only relabel the text already in that line,
 * never attach a title/company from elsewhere in the document.
 */
function fixEntryMeta(entry: ExperienceEntry, index: number, ai: AiParsedResume, used: Set<number>): ExperienceEntry | null {
  const metaText = entry.evidence.map((e) => e.text).join('\n')
  for (let i = 0; i < ai.experience.length; i++) {
    if (used.has(i)) continue
    const candidate = ai.experience[i]!
    if (!candidate.title || !candidate.company) continue
    const title = locateInSource(candidate.title, metaText)
    const company = locateInSource(candidate.company, metaText)
    if (!title || !company) continue
    const t = normalizeForGrounding(title)
    const c = normalizeForGrounding(company)
    if (t.includes(c) || c.includes(t)) continue
    used.add(i)
    return buildExperienceEntry(
      {
        title,
        company,
        startDate: entry.startDate,
        endDate: entry.endDate,
        isCurrent: entry.isCurrent,
        location: entry.location,
        bullets: entry.bullets.map((b) => b.text),
        metaLines: entry.evidence.map((e) => e.text),
        warnings: entry.warnings,
      },
      index,
    )
  }
  return null
}

export interface MergeResult {
  resume: Resume
  filledFields: string[]
}

/**
 * Fills only the targeted, still-empty fields of `resume` from a GROUNDED
 * AI extraction (the output of `groundAiExtraction` — never raw model
 * output). Parser warnings are kept as-is: they describe how a rule-based
 * ATS reads the document, which the AI fill doesn't change; what the AI
 * filled is recorded in `parserMetadata.aiAssist` instead. Returns the
 * input Resume unchanged (same object) when nothing was filled.
 */
export function mergeGroundedAiParse(
  resume: Resume,
  grounded: AiParsedResume,
  rawText: string,
  targets: AiAssistTargets,
  rejectedCount = 0,
): MergeResult {
  const filled: string[] = []

  const contact = targets.contact ? mergeContact(resume.contact, grounded, rawText, filled) : resume.contact

  let skills = resume.skills
  if (targets.skills && resume.skills.length === 0) {
    const fromAi = skillsFromAi(grounded, rawText)
    if (fromAi.length > 0) {
      skills = fromAi
      filled.push('skills')
    }
  }

  let experience = resume.experience
  if (targets.experience && resume.experience.length === 0) {
    const fromAi = experienceFromAi(grounded, rawText)
    if (fromAi.length > 0) {
      experience = fromAi
      filled.push('experience')
    }
  } else if (targets.experienceEntryIds.length > 0) {
    const used = new Set<number>()
    experience = resume.experience.map((entry, index) => {
      if (!targets.experienceEntryIds.includes(entry.id)) return entry
      const fixed = fixEntryMeta(entry, index, grounded, used)
      if (!fixed) return entry
      filled.push(`experience.${entry.id}.title`, `experience.${entry.id}.company`)
      return fixed
    })
  }

  if (filled.length === 0) return { resume, filledFields: [] }

  const merged = linkSkillEvidence({
    ...resume,
    contact,
    skills,
    experience,
    parserMetadata: { ...resume.parserMetadata, aiAssist: { filledFields: filled, rejectedCount } },
  })
  return { resume: merged, filledFields: filled }
}

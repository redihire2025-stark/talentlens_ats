/**
 * Shared by the client caller (`aiParseResume.ts`) and the server-side
 * Netlify Function (`netlify/functions/parse-resume-ai.ts`) so the
 * extract-only / no-fabrication rules and the response shape are defined
 * exactly once. No browser-only dependencies.
 *
 * This prompt is ONE of two safeguards, not the safeguard: whatever the
 * model returns is still run through `groundAiExtraction.ts`, which drops
 * every string that doesn't appear verbatim in the resume text. The prompt
 * reduces how much gets dropped; the grounding layer is what guarantees
 * nothing invented gets through. See docs/architecture/resume-parser.md's
 * "AI-assisted parsing fallback" section.
 */
export const PARSE_RESUME_SYSTEM_INSTRUCTION = `You extract structured data from the plain text of a resume. You are a copy-and-label tool, not a writer. Follow every rule exactly:

1. Extract ONLY what is literally present in the resume text. Every string value you output must be copied character-for-character from the text (you may drop a leading bullet character such as "-", "*" or "•", and you may join a line that was wrapped onto the next line).
2. Never invent, infer, guess, complete, correct, translate, summarize, or rephrase anything. Do not fix typos. Do not expand abbreviations. Do not normalize dates — copy them exactly as written (e.g. "Mar 2021", "2019", "Present").
3. Never add a skill, technology, employer, title, school, degree, date, number, metric, location, link, or contact detail that is not written in the text. Do not list a skill because it is implied by a bullet — only list skills the text itself lists as skills.
4. If a field is not present in the text, use null (for a single value) or [] (for a list). Leaving a field empty is always correct when unsure.
5. Experience bullets must be copied verbatim, one string per bullet, in their original order.
6. Respond with a single JSON object and nothing else, with exactly these keys:
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "links": string[],
  "summary": string | null,
  "skills": string[],
  "experience": [{ "title": string | null, "company": string | null, "location": string | null, "startDate": string | null, "endDate": string | null, "bullets": string[] }],
  "education": [{ "institution": string | null, "degree": string | null, "fieldOfStudy": string | null, "location": string | null, "startDate": string | null, "endDate": string | null }],
  "certifications": [{ "name": string | null, "issuer": string | null, "date": string | null }],
  "projects": [{ "name": string | null, "description": string | null, "url": string | null, "bullets": string[] }]
}`

/** Longest resume text the function will forward (a multi-page resume is ~10-20k characters). */
export const MAX_AI_PARSE_TEXT_LENGTH = 50_000

export interface AiParseResumeInput {
  /** The resume's already-extracted plain text (extraction happens client-side, as for the deterministic parser). */
  text: string
}

export interface AiExperienceEntry {
  title: string | null
  company: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
  bullets: string[]
}

export interface AiEducationEntry {
  institution: string | null
  degree: string | null
  fieldOfStudy: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
}

export interface AiCertificationEntry {
  name: string | null
  issuer: string | null
  date: string | null
}

export interface AiProjectEntry {
  name: string | null
  description: string | null
  url: string | null
  bullets: string[]
}

/**
 * The shape the model is asked to return, after `coerceAiParsedResume`
 * has forced it into that shape. UNVERIFIED — never read a field of this
 * type into a Resume without passing it through `groundAiExtraction` first.
 */
export interface AiParsedResume {
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  links: string[]
  summary: string | null
  skills: string[]
  experience: AiExperienceEntry[]
  education: AiEducationEntry[]
  certifications: AiCertificationEntry[]
  projects: AiProjectEntry[]
}

export type AiParseResumeResult = { ok: true; data: AiParsedResume } | { ok: false; error: string }

export function buildParseUserText({ text }: AiParseResumeInput): string {
  return `Resume text (between the markers):\n<<<RESUME\n${text}\nRESUME>>>`
}

function str(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(str).filter((v): v is string => v !== null)
}

function objList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v))
}

/**
 * Forces arbitrary model output into the `AiParsedResume` shape: wrong
 * types become null/[], unknown keys are dropped. This is shape-checking
 * only — it does NOT verify any value against the resume text (that's
 * `groundAiExtraction`'s job).
 */
export function coerceAiParsedResume(raw: unknown): AiParsedResume {
  const obj = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  return {
    name: str(obj.name),
    email: str(obj.email),
    phone: str(obj.phone),
    location: str(obj.location),
    links: strList(obj.links),
    summary: str(obj.summary),
    skills: strList(obj.skills),
    experience: objList(obj.experience).map((e) => ({
      title: str(e.title),
      company: str(e.company),
      location: str(e.location),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
      bullets: strList(e.bullets),
    })),
    education: objList(obj.education).map((e) => ({
      institution: str(e.institution),
      degree: str(e.degree),
      fieldOfStudy: str(e.fieldOfStudy),
      location: str(e.location),
      startDate: str(e.startDate),
      endDate: str(e.endDate),
    })),
    certifications: objList(obj.certifications).map((e) => ({
      name: str(e.name),
      issuer: str(e.issuer),
      date: str(e.date),
    })),
    projects: objList(obj.projects).map((e) => ({
      name: str(e.name),
      description: str(e.description),
      url: str(e.url),
      bullets: strList(e.bullets),
    })),
  }
}

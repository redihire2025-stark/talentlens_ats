import type { Resume } from '@/types/resume'

export interface ExportExperienceBlock {
  title: string
  company: string
  startDate: string | null
  endDate: string | null
  /** Each bullet's `text` — the only part of an `ExperienceBullet` that is resume content; its derived fields are analysis, never exported. */
  bullets: string[]
}

export interface ExportProjectBlock {
  name: string
  description: string | null
  bullets: string[]
}

/** The plain-text content both exporters render — one place that decides what from the canonical `Resume` ends up in an exported file. */
export interface ExportContent {
  name: string
  contactLine: string
  links: string[]
  summary: string | null
  skillsLine: string
  experience: ExportExperienceBlock[]
  education: string[]
  certifications: { name: string; issuer: string | null }[]
  projects: ExportProjectBlock[]
}

export function buildExportContent(resume: Resume): ExportContent {
  return {
    name: resume.contact.name ?? 'Resume',
    contactLine: [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(' | '),
    links: resume.contact.links.map((link) => link.url),
    summary: resume.summary,
    // `rawName` — the skill exactly as the candidate wrote it, never the canonical form.
    skillsLine: resume.skills.map((skill) => skill.rawName).join(', '),
    experience: resume.experience.map((entry) => ({
      title: entry.title,
      company: entry.company,
      startDate: entry.startDate,
      endDate: entry.endDate,
      bullets: entry.bullets.map((bullet) => bullet.text),
    })),
    education: resume.education.map((entry) => [entry.institution, entry.degree, entry.fieldOfStudy].filter(Boolean).join(', ')),
    certifications: resume.certifications.map((cert) => ({ name: cert.name, issuer: cert.issuer })),
    projects: resume.projects.map((project) => ({ name: project.name, description: project.description, bullets: project.bullets })),
  }
}

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { Resume } from '@/types/resume'

function formatDateRange(startDate: string | null, endDate: string | null): string {
  const format = (d: string | null) => (d ? d.slice(0, 7) : '')
  if (!startDate && !endDate) return ''
  return `${format(startDate)} – ${endDate ? format(endDate) : 'Present'}`
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })
}

function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } })
}

/**
 * Renders a Resume as a plain, single-column DOCX — headings and bullet
 * lists only, no tables, columns, text boxes, or images. This mirrors the
 * ATS engine's own formatting guidance (docs/scoring/scoring-methodology.md):
 * the safest export format is the one least likely to confuse a real ATS
 * parser, not the most decorative one.
 */
export async function buildResumeDocx(resume: Resume): Promise<Blob> {
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      children: [new TextRun({ text: resume.candidate.name ?? 'Resume', bold: true, size: 32 })],
      spacing: { after: 80 },
    }),
  )

  const contactLine = [resume.candidate.email, resume.candidate.phone, resume.candidate.location]
    .filter(Boolean)
    .join(' | ')
  if (contactLine) {
    children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: 20 })], spacing: { after: 40 } }))
  }
  for (const link of resume.candidate.links) {
    children.push(new Paragraph({ children: [new TextRun({ text: link.url, size: 20 })], spacing: { after: 40 } }))
  }

  if (resume.summary) {
    children.push(sectionHeading('Summary'))
    children.push(new Paragraph({ text: resume.summary, spacing: { after: 120 } }))
  }

  if (resume.skills.length > 0) {
    children.push(sectionHeading('Skills'))
    children.push(new Paragraph({ text: resume.skills.map((s) => s.name).join(', '), spacing: { after: 120 } }))
  }

  if (resume.experience.length > 0) {
    children.push(sectionHeading('Experience'))
    for (const entry of resume.experience) {
      const dateRange = formatDateRange(entry.startDate, entry.endDate)
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${entry.title}, ${entry.company}`, bold: true }),
            ...(dateRange ? [new TextRun({ text: `  (${dateRange})`, italics: true })] : []),
          ],
          spacing: { before: 120, after: 60 },
        }),
      )
      for (const b of entry.bullets) children.push(bullet(b))
    }
  }

  if (resume.education.length > 0) {
    children.push(sectionHeading('Education'))
    for (const entry of resume.education) {
      const line = [entry.institution, entry.degree, entry.fieldOfStudy].filter(Boolean).join(', ')
      children.push(new Paragraph({ text: line, spacing: { after: 60 } }))
    }
  }

  if (resume.certifications.length > 0) {
    children.push(sectionHeading('Certifications'))
    for (const cert of resume.certifications) {
      children.push(new Paragraph({ text: [cert.name, cert.issuer].filter(Boolean).join(' — '), spacing: { after: 60 } }))
    }
  }

  if (resume.projects.length > 0) {
    children.push(sectionHeading('Projects'))
    for (const project of resume.projects) {
      children.push(new Paragraph({ children: [new TextRun({ text: project.name, bold: true })], spacing: { before: 80 } }))
      if (project.description) children.push(new Paragraph({ text: project.description, spacing: { after: 40 } }))
      for (const b of project.bullets) children.push(bullet(b))
    }
  }

  const document = new Document({ sections: [{ children }] })
  return Packer.toBlob(document)
}

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { Resume } from '@/types/resume'
import { buildExportContent } from './exportContent'

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
  const content = buildExportContent(resume)
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      children: [new TextRun({ text: content.name, bold: true, size: 32 })],
      spacing: { after: 80 },
    }),
  )

  if (content.contactLine) {
    children.push(new Paragraph({ children: [new TextRun({ text: content.contactLine, size: 20 })], spacing: { after: 40 } }))
  }
  for (const url of content.links) {
    children.push(new Paragraph({ children: [new TextRun({ text: url, size: 20 })], spacing: { after: 40 } }))
  }

  if (content.summary) {
    children.push(sectionHeading('Summary'))
    children.push(new Paragraph({ text: content.summary, spacing: { after: 120 } }))
  }

  if (content.skillsLine) {
    children.push(sectionHeading('Skills'))
    children.push(new Paragraph({ text: content.skillsLine, spacing: { after: 120 } }))
  }

  if (content.experience.length > 0) {
    children.push(sectionHeading('Experience'))
    for (const entry of content.experience) {
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

  if (content.education.length > 0) {
    children.push(sectionHeading('Education'))
    for (const line of content.education) {
      children.push(new Paragraph({ text: line, spacing: { after: 60 } }))
    }
  }

  if (content.certifications.length > 0) {
    children.push(sectionHeading('Certifications'))
    for (const cert of content.certifications) {
      children.push(new Paragraph({ text: [cert.name, cert.issuer].filter(Boolean).join(' — '), spacing: { after: 60 } }))
    }
  }

  if (content.projects.length > 0) {
    children.push(sectionHeading('Projects'))
    for (const project of content.projects) {
      children.push(new Paragraph({ children: [new TextRun({ text: project.name, bold: true })], spacing: { before: 80 } }))
      if (project.description) children.push(new Paragraph({ text: project.description, spacing: { after: 40 } }))
      for (const b of project.bullets) children.push(bullet(b))
    }
  }

  const document = new Document({ sections: [{ children }] })
  return Packer.toBlob(document)
}

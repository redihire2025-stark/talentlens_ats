import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import type { Resume } from '@/types/resume'

const PAGE_SIZE: [number, number] = [612, 792] // US Letter, points
const MARGIN = 54
const LINE_HEIGHT = 14

function formatDateRange(startDate: string | null, endDate: string | null): string {
  const format = (d: string | null) => (d ? d.slice(0, 7) : '')
  if (!startDate && !endDate) return ''
  return `${format(startDate)} - ${endDate ? format(endDate) : 'Present'}`
}

/** Wraps text to fit within maxWidth for the given font/size — pdf-lib has no built-in word wrap. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

/**
 * Renders a Resume as a single-column, text-only PDF — no tables, columns,
 * or images, for the same reason exportDocx.ts avoids them: this is meant
 * to be the safest format for a real ATS to parse, not the most visually
 * elaborate one.
 */
export async function buildResumePdf(resume: Resume): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage(PAGE_SIZE)
  let y = PAGE_SIZE[1] - MARGIN
  const maxWidth = PAGE_SIZE[0] - MARGIN * 2

  function newPageIfNeeded(neededHeight: number) {
    if (y - neededHeight < MARGIN) {
      page = pdfDoc.addPage(PAGE_SIZE)
      y = PAGE_SIZE[1] - MARGIN
    }
  }

  function drawLine(text: string, options: { size?: number; bold?: boolean; indent?: number; gapAfter?: number } = {}) {
    const size = options.size ?? 10
    const usedFont = options.bold ? boldFont : font
    const indent = options.indent ?? 0
    const lines = wrapText(text, usedFont, size, maxWidth - indent)

    for (const line of lines) {
      newPageIfNeeded(LINE_HEIGHT)
      page.drawText(line, { x: MARGIN + indent, y, size, font: usedFont, color: rgb(0.1, 0.1, 0.1) })
      y -= LINE_HEIGHT
    }
    y -= options.gapAfter ?? 0
  }

  function drawHeading(text: string) {
    newPageIfNeeded(LINE_HEIGHT * 2)
    y -= 6
    drawLine(text.toUpperCase(), { size: 12, bold: true, gapAfter: 4 })
  }

  drawLine(resume.candidate.name ?? 'Resume', { size: 18, bold: true, gapAfter: 4 })

  const contactLine = [resume.candidate.email, resume.candidate.phone, resume.candidate.location].filter(Boolean).join(' | ')
  if (contactLine) drawLine(contactLine, { size: 10 })
  for (const link of resume.candidate.links) drawLine(link.url, { size: 10 })

  if (resume.summary) {
    drawHeading('Summary')
    drawLine(resume.summary, { gapAfter: 4 })
  }

  if (resume.skills.length > 0) {
    drawHeading('Skills')
    drawLine(resume.skills.map((s) => s.name).join(', '), { gapAfter: 4 })
  }

  if (resume.experience.length > 0) {
    drawHeading('Experience')
    for (const entry of resume.experience) {
      const dateRange = formatDateRange(entry.startDate, entry.endDate)
      drawLine(`${entry.title}, ${entry.company}${dateRange ? `  (${dateRange})` : ''}`, { bold: true, gapAfter: 2 })
      for (const bullet of entry.bullets) drawLine(`• ${bullet}`, { indent: 10 })
      y -= 4
    }
  }

  if (resume.education.length > 0) {
    drawHeading('Education')
    for (const entry of resume.education) {
      drawLine([entry.institution, entry.degree, entry.fieldOfStudy].filter(Boolean).join(', '))
    }
  }

  if (resume.certifications.length > 0) {
    drawHeading('Certifications')
    for (const cert of resume.certifications) {
      drawLine([cert.name, cert.issuer].filter(Boolean).join(' - '))
    }
  }

  if (resume.projects.length > 0) {
    drawHeading('Projects')
    for (const project of resume.projects) {
      drawLine(project.name, { bold: true, gapAfter: 2 })
      if (project.description) drawLine(project.description)
      for (const bullet of project.bullets) drawLine(`• ${bullet}`, { indent: 10 })
      y -= 4
    }
  }

  const bytes = await pdfDoc.save()
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}

// Exposed for testing word-wrap without needing to parse a real PDF back.
export const __internal = { wrapText }

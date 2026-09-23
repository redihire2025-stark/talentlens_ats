import { describe, expect, it } from 'vitest'
import { buildResumePdf, __internal } from './exportPdf'
import { buildTestResume } from '@/lib/ats/testFixtures'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'

/** jsdom's Blob polyfill doesn't implement arrayBuffer(); FileReader works in both jsdom and real browsers. */
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

describe('buildResumePdf', () => {
  it('produces a valid, non-empty PDF blob', async () => {
    const blob = await buildResumePdf(buildTestResume())
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('application/pdf')

    // Round-trip through pdf-lib to confirm it's actually a well-formed PDF, not just bytes.
    const bytes = new Uint8Array(await readBlobAsArrayBuffer(blob))
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1)
  })

  it('does not throw for a resume with empty optional sections', async () => {
    const resume = buildTestResume({ certifications: [], projects: [], education: [] })
    await expect(buildResumePdf(resume)).resolves.toBeInstanceOf(Blob)
  })

  it('paginates onto a new page when content overflows one page', async () => {
    const manyBullets = Array.from({ length: 80 }, (_, i) => `Accomplishment number ${i} with enough detail to take real vertical space.`)
    const resume = buildTestResume({
      experience: buildExperienceEntries([{ company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: manyBullets }]),
    })
    const blob = await buildResumePdf(resume)
    const bytes = new Uint8Array(await readBlobAsArrayBuffer(blob))
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBeGreaterThan(1)
  })
})

describe('wrapText', () => {
  it('splits long text into multiple lines that each fit within maxWidth', async () => {
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const longText = 'This is a fairly long sentence that should not fit on a single narrow line of a resume PDF.'
    const lines = __internal.wrapText(longText, font, 10, 100)

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(font.widthOfTextAtSize(line, 10)).toBeLessThanOrEqual(100)
    }
    expect(lines.join(' ')).toBe(longText)
  })

  it('returns a single empty line for empty input rather than an empty array', () => {
    expect(__internal.wrapText('', {} as never, 10, 100)).toEqual([''])
  })
})

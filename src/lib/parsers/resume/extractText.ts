import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import mammoth from 'mammoth'
import type { ResumeSourceFormat } from './validateFile'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

/**
 * Thin adapter over pdfjs-dist and mammoth — both well-tested third-party
 * libraries, so this module isn't unit tested with binary fixtures (see
 * docs/architecture/resume-parser.md). The parsing logic we own,
 * `parseResumeText`, is unit tested thoroughly against plain text instead.
 */
export async function extractResumeText(file: File, sourceFormat: ResumeSourceFormat): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  return sourceFormat === 'pdf' ? extractPdfText(arrayBuffer) : extractDocxText(arrayBuffer)
}

async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageTexts: string[] = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    // pdf.js doesn't preserve line breaks directly; `hasEOL` on each text
    // item is the closest approximation of "this is the end of a line."
    const pageText = content.items
      .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
      .join('')
    pageTexts.push(pageText)
  }
  return pageTexts.join('\n')
}

async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

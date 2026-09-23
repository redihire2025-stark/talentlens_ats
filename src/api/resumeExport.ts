import type { Resume } from '@/types/resume'
import type { ApiResult } from './types'

export type ExportFormat = 'pdf' | 'docx'

export interface ExportResumeRequest {
  resume: Resume
  format: ExportFormat
}

export interface ExportResumeResponse {
  blob: Blob
  filename: string
}

function filenameFor(resume: Resume, format: ExportFormat): string {
  const base = (resume.contact.name ?? 'resume').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${base || 'resume'}.${format}`
}

/**
 * POST /api/resume/export
 *
 * Dynamically imports the export library for the requested format only
 * (docx or pdf-lib) — same lazy-loading rationale as the parsers
 * (src/api/resumeParse.ts): most sessions only ever export once, in one
 * format.
 */
export async function exportResume(request: ExportResumeRequest): Promise<ApiResult<ExportResumeResponse>> {
  if (!request?.resume) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A resume is required.' } }
  }

  try {
    const blob =
      request.format === 'docx'
        ? await (await import('@/lib/resume-generation/exportDocx')).buildResumeDocx(request.resume)
        : await (await import('@/lib/resume-generation/exportPdf')).buildResumePdf(request.resume)

    return { ok: true, data: { blob, filename: filenameFor(request.resume, request.format) } }
  } catch {
    return { ok: false, error: { code: 'EXPORT_FAILED', message: 'Something went wrong while generating the export file.' } }
  }
}

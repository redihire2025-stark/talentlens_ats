import type { Resume } from '@/types/resume'
import type { ResumeVersion, ResumeVersionScoreSnapshot } from '@/types/resumeVersion'
import { diffResumeChanges } from '@/lib/resume-generation/diffResume'
import type { ApiResult } from './types'

export interface CreateResumeVersionRequest {
  label: string
  resume: Resume
  /** The version this one is saved from — `null` only for the very first ("original") version. */
  parentVersion: ResumeVersion | null
  scoreSnapshot: ResumeVersionScoreSnapshot
}
export interface CreateResumeVersionResponse {
  version: ResumeVersion
}

/**
 * POST /api/resumes/:id/versions (PRD §19/§16). Stateless like every
 * function in this folder — it builds one immutable `ResumeVersion`
 * snapshot (with a human-readable diff against its parent) but does not
 * itself own the version list; `useVersionsStore` on the client keeps that
 * list and calls this for the actual "what does a new version look like"
 * logic, the same in-process-now / real-endpoint-later pattern as every
 * other `src/api/*` function (see docs/architecture/overview.md).
 */
export async function createResumeVersion(request: CreateResumeVersionRequest): Promise<ApiResult<CreateResumeVersionResponse>> {
  if (!request?.resume || !request?.label) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A resume and label are both required.' } }
  }

  const version: ResumeVersion = {
    id: request.parentVersion ? `version-${Date.now()}` : 'original',
    parentVersionId: request.parentVersion?.id ?? null,
    label: request.label,
    createdAt: new Date().toISOString(),
    resume: request.resume,
    changes: request.parentVersion ? diffResumeChanges(request.parentVersion.resume, request.resume) : [],
    scoreSnapshot: request.scoreSnapshot,
  }

  return { ok: true, data: { version } }
}

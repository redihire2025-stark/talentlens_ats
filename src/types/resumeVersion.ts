import type { Id, ISODateString, Nullable } from './common'
import type { Resume } from './resume'

export interface ResumeVersionScoreSnapshot {
  ats: number
  /** Null when this version was saved before any job description had been analyzed. */
  jdMatch: Nullable<number>
}

/**
 * One immutable snapshot in a resume's edit history. The original upload
 * is always version `'original'` with `parentVersionId: null`; every
 * other version points back to the version it was saved from, so the
 * full history is reconstructible. Never destroyed or overwritten — see
 * "RESUME VERSIONING" in AGENTS.md.
 */
export interface ResumeVersion {
  id: Id
  parentVersionId: Nullable<Id>
  label: string
  createdAt: ISODateString
  resume: Resume
  /** Human-readable summary of what changed vs. the parent version. */
  changes: string[]
  scoreSnapshot: ResumeVersionScoreSnapshot
}

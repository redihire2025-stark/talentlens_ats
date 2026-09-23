import type { Id, ISODateString, Nullable } from './common'
import type { Resume } from './resume'
import type { ScoreBreakdown } from './score'

export interface ResumeVersionScoreSnapshot {
  ats: number
  /** Null when this version was saved before any job description had been analyzed. */
  jdMatch: Nullable<number>
  /** Resume Health's 7 `ScoreComponent`s at the time this version was saved — lets a later before/after comparison explain *why* the ATS score changed (spec §48), not just report the two numbers. Optional only for backward compatibility with any snapshot saved before this field existed. */
  atsBreakdown?: ScoreBreakdown
  /** Job Match's 8 `ScoreComponent`s, when a JD was active when this version was saved. */
  jdMatchBreakdown?: ScoreBreakdown
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

import { create } from 'zustand'
import type { Resume } from '@/types/resume'
import type { ResumeVersion } from '@/types/resumeVersion'
import { diffResumeChanges } from '@/lib/resume-generation/diffResume'

const ORIGINAL_VERSION_ID = 'original'

interface VersionsState {
  versions: ResumeVersion[]
  activeVersionId: string | null

  /** Creates the 'original' version once, when a resume is first parsed. A no-op if already initialized. */
  initOriginal: (resume: Resume, atsScore: number) => void
  /** Saves the current draft as a new version, parented to whichever version is currently active. */
  saveVersion: (label: string, resume: Resume, atsScore: number, jdMatchScore: number | null) => ResumeVersion
  selectVersion: (id: string) => Resume | null
  reset: () => void
}

/** Resume version history — see docs/architecture/resume-schema.md's "RESUME VERSIONING" note and AGENTS.md. Original is never destroyed or overwritten. */
export const useVersionsStore = create<VersionsState>((set, get) => ({
  versions: [],
  activeVersionId: null,

  initOriginal: (resume, atsScore) => {
    if (get().versions.length > 0) return
    const original: ResumeVersion = {
      id: ORIGINAL_VERSION_ID,
      parentVersionId: null,
      label: 'Original',
      createdAt: new Date().toISOString(),
      resume,
      changes: [],
      scoreSnapshot: { ats: atsScore, jdMatch: null },
    }
    set({ versions: [original], activeVersionId: original.id })
  },

  saveVersion: (label, resume, atsScore, jdMatchScore) => {
    const { versions, activeVersionId } = get()
    const parent = versions.find((v) => v.id === activeVersionId) ?? versions[0] ?? null

    const version: ResumeVersion = {
      id: `version-${versions.length}`,
      parentVersionId: parent?.id ?? null,
      label,
      createdAt: new Date().toISOString(),
      resume,
      changes: parent ? diffResumeChanges(parent.resume, resume) : [],
      scoreSnapshot: { ats: atsScore, jdMatch: jdMatchScore },
    }

    set({ versions: [...versions, version], activeVersionId: version.id })
    return version
  },

  selectVersion: (id) => {
    const version = get().versions.find((v) => v.id === id)
    if (!version) return null
    set({ activeVersionId: id })
    return version.resume
  },

  reset: () => set({ versions: [], activeVersionId: null }),
}))

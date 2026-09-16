# lib/resume-generation

Applies accepted recommendation edits to produce new immutable resume
versions (original is never mutated), recalculates scores, and renders
export-ready PDF/DOCX output. Implemented in TASK-016 – TASK-018.

- `applyEdits.ts` — pure, immutable Resume field updates
  (`replaceExperienceBullet`, `updateSummary`, `updateSkillNames`,
  `updateExperienceField`) used by `editorStore` (TASK-016).
- `diffResume.ts` — `diffResumeChanges`, a human-readable summary of what
  changed between two Resume snapshots, used when saving a `ResumeVersion`
  and in the Before/After view (TASK-017). The `ResumeVersion` type itself
  lives in `src/types/resumeVersion.ts` alongside the other domain
  schemas, not here.

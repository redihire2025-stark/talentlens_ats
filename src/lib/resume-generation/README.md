# lib/resume-generation

Applies accepted recommendation edits to produce new immutable resume
versions (original is never mutated), recalculates scores, and renders
export-ready PDF/DOCX output. Implemented in TASK-016 – TASK-018.

- `applyEdits.ts` — pure, immutable Resume field updates
  (`replaceExperienceBullet`, `updateSummary`, `updateSkillNames`,
  `updateExperienceField`) used by `editorStore` (TASK-016). Full
  versioning (`ResumeVersion` snapshots) is TASK-017.

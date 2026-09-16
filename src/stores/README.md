# stores

Zustand state slices for anonymous session state. One store per concern —
never a single monolithic store:

- `resumeStore` — the uploaded file and its parsed `Resume` (TASK-013)
- `analysisStore` — the ATS Compatibility Score (TASK-013)
- `jobDescriptionStore` — the JD text/file and its parsed `JobDescription` (TASK-015)
- `matchStore` — the resume/JD `MatchAnalysis` and JD Match Score (TASK-015)
- `editorStore` — the working draft `Resume`, recommendation accept/reject/edit
  state, and the live-recalculated ATS/JD Match scores (TASK-016)
- `versionsStore` — resume version history: `ResumeVersion` snapshots with
  parent links, a human-readable diff, and a score snapshot (TASK-017)

There's no separate `ui` store yet — `App.tsx`'s single `useState<View>`
is enough for V1's linear screen flow (see "Screens vs. routing" in
docs/architecture/overview.md); one would be added if that stops being
true.

All state here is in-memory only — nothing is persisted, per the V1
anonymous/no-database constraint.

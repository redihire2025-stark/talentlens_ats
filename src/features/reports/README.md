# features/reports

Recommendation cards and export flow. `Recommendations.tsx` (still in
`src/components`) is wired to the recommendation engine and `editorStore`
as of TASK-016 — accepting a bullet-impact recommendation (with or without
an edit) applies it to the working draft resume. `ExportModal.tsx` is
wired to the export pipeline in TASK-018.

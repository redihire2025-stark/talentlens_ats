# features/resume-editor

Structured resume editor with live score recalculation, and the
before/after comparison view. `ResumeEditor.tsx` (still in
`src/components`) is wired to `editorStore` as of TASK-016: summary,
skills, and experience (title/company/bullets) are directly editable;
contact/education/projects/certifications are read-only displays of what
was parsed (not yet editable — a documented gap, not an oversight).
`BeforeAfter.tsx` is wired to `versionsStore` as of TASK-017: it compares
the `'original'` version against the currently selected (or most recently
saved) version, highlighting exactly which bullets changed.

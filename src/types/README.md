# types

Shared TypeScript types for the whole app. No `any`-based structures — every
shape used across features is defined here and imported, not redeclared.

- `common.ts` — cross-cutting primitives (`Id`, `ISODateString`, `Nullable<T>`)
- `score.ts` — `MatchStatus` and `ScoreResult<TBreakdown>`, the shared
  response envelope for both the ATS Compatibility Score and the JD Match
  Score (see `docs/scoring/scoring-methodology.md`)
- `resume.ts` — the `Resume` domain schema (see
  `docs/architecture/resume-schema.md`)
- `jobDescription.ts` — the `JobDescription` domain schema (see
  `docs/architecture/jd-schema.md`)
- `resumeVersion.ts` — `ResumeVersion`, an immutable snapshot in a
  resume's edit history (parent-linked, never overwritten — TASK-017)

API request/response contracts are added in TASK-012.

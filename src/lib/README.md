# lib

Deterministic domain engines — the actual "resume intelligence" of
TalentLens. Each subfolder is a single-responsibility module with no
dependency on React or Zustand, so it can be unit tested in isolation and,
later, extracted into its own package or moved behind a real API boundary
without changes to its internals.

- `parsers/` — PDF/DOCX → structured Resume JSON, JD text → structured JD
  JSON (TASK-004, TASK-006)
- `normalization/` — skill/title/keyword canonicalization used by every
  other engine (TASK-007)
- `ats/` — ATS compatibility analysis: parseability, sections, formatting
  risk, etc. (TASK-008)
- `matching/` — resume-to-JD matching (exact → normalized → synonym →
  fuzzy → optional semantic) and score calculation (TASK-009, TASK-010)
- `recommendations/` — evidence-based recommendation generation; never
  fabricates metrics, employers, or technologies (TASK-011)
- `resume-generation/` — applies accepted edits to produce new resume
  versions and export-ready output (TASK-016 – TASK-018)
- `ai/` — the one AI-backed feature (optional bullet-rewrite suggestions),
  proxied through a server-side Netlify Function so the API key never
  reaches the client bundle — see `src/lib/ai/README.md` and
  `docs/architecture/overview.md`'s "AI Layer" section

No external LLM call is a hard dependency of any module in this folder. AI
abstractions (`SemanticMatcher`, `RecommendationProvider`, `src/lib/ai/`)
exist as interfaces/features with deterministic default behavior, so they
are optional enhancements, never requirements, of the Resume Health or
matching engines.

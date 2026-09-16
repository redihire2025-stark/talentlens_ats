# lib/matching

Resume ↔ Job Description matching engine, implemented in TASK-009. Produces
structured per-category results (`MatchAnalysis`) — it deliberately stops
short of computing the final JD Match Score, which is the score engine's
job (TASK-010). See `docs/scoring/matching-rules.md`.

- `fuzzyMatch.ts` — `tokenOverlapRatio`, the shared last-resort layer
- `skillMatcher.ts` — layered skill matching (exact/normalized/synonym →
  precise bullet mention → fuzzy)
- `titleMatcher.ts` — core-title comparison via the normalization engine,
  seniority surfaced in the explanation rather than failing the match
- `experienceMatcher.ts` — years-of-experience calculation (calendar span,
  not summed durations) and comparison against the JD's range
- `educationMatcher.ts` — degree/field matching, with "equivalent
  experience" JD language given real weight
- `responsibilityMatcher.ts` — prose-to-prose fuzzy matching (the primary
  layer here, unlike skills)
- `matchResume.ts` — orchestrator combining all of the above
- `semanticMatcher.ts` — the `SemanticMatcher` AI-abstraction interface
  plus `NoopSemanticMatcher`; not wired into `matchResume` in V1

# lib/recommendations

Evidence-based recommendation generation, implemented in TASK-011. Every
recommendation traces back to real resume/JD content — none is generated
from a fabricated metric, employer, technology, or achievement (see
"RECOMMENDATION ENGINE" in AGENTS.md and `docs/product/v1-scope.md`).

- `bulletImpactRecommendations.ts` — flags bullets missing an action verb
  or a quantifiable metric (reuses `src/lib/ats/bulletQuality.ts`)
- `missingSectionRecommendations.ts` — one per missing required
  section/field (reuses `src/lib/ats/sectionAnalyzer.ts`'s check list)
- `skillEvidenceRecommendations.ts` — skills listed but never demonstrated
  in a bullet (reuses `src/lib/ats/skillsEvidenceAnalyzer.ts`'s split)
- `formattingRecommendations.ts` — experience entries with no bullet points
- `skillGapRecommendations.ts` — missing/partial required or preferred
  skills from the matching engine (TASK-009); only runs when a JD was
  analyzed
- `titleAlignmentRecommendations.ts` — title mismatch guidance; only runs
  when a JD was analyzed
- `impactConfig.ts` — `RECOMMENDATION_IMPACT`, the point-estimate config
  per category (configuration, not scattered magic numbers)
- `generateRecommendations.ts` — the entry point combining all generators

No generator ever proposes replacement wording containing invented
numbers, employers, or technologies — guidance always asks the user to add
specifics themselves, and explicitly says not to add a claim that isn't
true.

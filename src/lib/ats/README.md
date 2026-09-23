# lib/ats

The Resume Health / ATS Readiness engine. Resume-only — never requires a job
description. Organized into the 7 PRD §11 categories (see
`docs/product/target-architecture-prd.md` and
`docs/scoring/scoring-methodology.md` for what each category measures and
why):

| Category (`AtsScoreCategory`) | Analyzer(s) |
| --- | --- |
| `atsEssentials` | `parsingAnalyzer.ts` |
| `resumeStructure` | `sectionAnalyzer.ts` |
| `contentQuality` | `contentQualityAnalyzer.ts` |
| `skillsEvidence` | `skillsEvidenceAnalyzer.ts` + `keywordAnalyzer.ts` (averaged) |
| `experienceSeniority` | `experienceStructureAnalyzer.ts` |
| `recruiterReadability` | `formattingAnalyzer.ts` |
| `riskConsistency` | `riskConsistencyAnalyzer.ts` (date conflicts, overlapping employment, duplicate entries, malformed links) |

- `types.ts` — `AtsAnalysisInput`, `AtsScoreBreakdown`/`AtsScoreCategory`, `AnalyzerResult`
- `scoringConfig.ts` — `ATS_SCORE_WEIGHTS`
- `scoreCalculator.ts` — combines the 7 sub-scores into one overall score
  using the configured weights
- `analyzeAtsCompatibility.ts` — the entry point: runs every analyzer and
  returns a `ScoreResult<AtsScoreBreakdown>`
- `testFixtures.ts` — shared resume fixtures for the analyzer tests

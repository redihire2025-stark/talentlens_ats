# lib/ats

The ATS Compatibility engine, implemented in TASK-008. Resume-only — never
requires a job description. See `docs/scoring/scoring-methodology.md` for
what each category measures and why.

- `types.ts` — `AtsAnalysisInput`, `AtsScoreBreakdown`/`AtsScoreCategory`, `AnalyzerResult`
- `scoringConfig.ts` — `ATS_SCORE_WEIGHTS`
- `parsingAnalyzer.ts`, `sectionAnalyzer.ts`, `keywordAnalyzer.ts`,
  `experienceStructureAnalyzer.ts`, `skillsEvidenceAnalyzer.ts`,
  `formattingAnalyzer.ts`, `contentQualityAnalyzer.ts` — one analyzer per
  category, single responsibility
- `scoreCalculator.ts` — combines the 7 sub-scores into one overall score
  using the configured weights
- `analyzeAtsCompatibility.ts` — the entry point: runs every analyzer and
  returns a `ScoreResult<AtsScoreBreakdown>`
- `testFixtures.ts` — shared resume fixtures for the analyzer tests

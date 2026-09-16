# features/ats-analysis

ATS Compatibility dashboard and score breakdown UI. `ATSDashboard.tsx`
(still in `src/components` — not yet moved into this folder) is wired to
`analysisStore`/`resumeStore` as of TASK-014.

- `atsCategoryDisplay.ts` — display labels, the strong/good/needs-
  improvement health-status thresholds (matching `shared.tsx`'s existing
  85/70 convention), and `explanationForCategory` for pairing a category
  with its explanation from a real `ScoreResult`.

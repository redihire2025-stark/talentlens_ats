# stores

Zustand state slices for anonymous session state. One store per concern —
never a single monolithic store:

- `resumeStore` — the uploaded file and its parsed `Resume` (TASK-013)
- `analysisStore` — the ATS Compatibility Score (TASK-013)
- `jobDescription` — parsed JD JSON, input state (TASK-015)
- `editor` — recommendation accept/reject/edit state, draft edits (TASK-016)
- `versions` — resume version history (original, v1, v2, tailored) (TASK-017)

There's no separate `ui` store yet — `App.tsx`'s single `useState<View>`
is enough for V1's linear screen flow (see "Screens vs. routing" in
docs/architecture/overview.md); one would be added if that stops being
true.

All state here is in-memory only — nothing is persisted, per the V1
anonymous/no-database constraint.

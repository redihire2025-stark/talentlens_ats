# stores

Zustand state slices for anonymous session state. One store per concern —
never a single monolithic store:

- `resume` — parsed/edited Resume JSON, upload state
- `jobDescription` — parsed JD JSON, input state
- `analysis` — ATS score + JD match results, breakdowns
- `editor` — recommendation accept/reject/edit state, draft edits
- `versions` — resume version history (original, v1, v2, tailored)
- `ui` — cross-cutting UI state (active view, modals, toasts)

Slices are added as the features that need them are built (starting
TASK-013). All state here is in-memory only — nothing is persisted, per the
V1 anonymous/no-database constraint.

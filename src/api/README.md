# api

The client-facing service layer. Each function here corresponds 1:1 to a
REST endpoint in `docs/api/api-spec.md` (`parseResume`, `analyzeResume`,
`parseJobDescription`, `matchResumeToJob`, `generateRecommendations`,
`optimizeResume`, `exportResume`).

For V1, these call straight into `src/lib` engine modules in-process — see
"Why no separate backend in V1" in `docs/architecture/overview.md`. Keeping
this layer typed and endpoint-shaped means swapping the implementation for
real HTTP calls (e.g. Netlify Functions) later is a change local to this
folder, not a rewrite of callers or engines.

Implemented alongside the engines they front, starting TASK-004.

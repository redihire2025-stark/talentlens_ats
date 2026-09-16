# api

The client-facing service layer, implemented in TASK-012. Each function
corresponds 1:1 to a REST endpoint in `docs/api/api-spec.md`. For V1,
every function calls straight into `src/lib/*` in-process — see "Why no
separate backend in V1" in `docs/architecture/overview.md`.

- `types.ts` — `ApiResult<T>`/`ApiError` envelope, plus each endpoint's
  typed request/response
- `health.ts` — `getHealth`
- `resumeParse.ts` — `parseResume`
- `resumeAnalyze.ts` — `analyzeResume`
- `jdParse.ts` — `parseJobDescriptionFromText`, `parseJobDescriptionFromFile`
- `match.ts` — `matchResumeToJob`
- `recommendations.ts` — `getRecommendations`

Every function returns `Promise<ApiResult<T>>` — `{ ok: true, data }` or
`{ ok: false, error: { code, message } }` — never throws for an expected
failure (an unsupported file, a missing field), so callers don't need
try/catch for the common cases. `resume/optimize` and `resume/export` are
added in TASK-016 and TASK-018, once the engines behind them exist.

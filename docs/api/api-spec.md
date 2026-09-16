# API Spec

> `src/api/` implements every endpoint below except `resume/optimize`,
> which is not a separate endpoint in the client-only V1 architecture —
> edits are applied directly to the working draft via `editorStore`
> (TASK-016) rather than round-tripping through a service call.

## How these endpoints are implemented in V1

See "Why no separate backend app in V1" in `docs/architecture/overview.md`.
Each route below has a corresponding function in `src/api/` with the same
request/response shape; for V1 that function calls into `src/lib/*`
in-process instead of making an HTTP request. The contract is fixed now so
switching to a real network call later doesn't change any caller.

## Endpoints

| Method & path | `src/api` function | Request | Response | Backed by |
| --- | --- | --- | --- | --- |
| `POST /api/resume/parse` | `parseResume` | resume file | `{ resume, warnings }` | `src/lib/parsers/resume` |
| `POST /api/resume/analyze` | `analyzeResume` | `{ resume, parserWarnings? }` | `{ result: ScoreResult<AtsScoreBreakdown> }` | `src/lib/ats` |
| `POST /api/jd/parse` | `parseJobDescriptionFromText` / `parseJobDescriptionFromFile` | JD text, or a file | `{ jobDescription, warnings }` | `src/lib/parsers/jd` |
| `POST /api/match` | `matchResumeToJob` | `{ resume, jobDescription, atsScore }` | `{ analysis, result: ScoreResult<JdMatchScoreBreakdown> }` | `src/lib/matching` |
| `POST /api/recommendations` | `getRecommendations` | `{ resume, parserWarnings?, matchAnalysis? }` | `{ recommendations }` | `src/lib/recommendations` |
| `POST /api/resume/optimize` | _(not a separate endpoint — see above)_ | — | — | `editorStore` + `src/lib/resume-generation/applyEdits.ts` |
| `POST /api/resume/export` | `exportResume` | `{ resume, format: 'pdf' \| 'docx' }` | `{ blob, filename }` | `src/lib/resume-generation/exportDocx.ts` / `exportPdf.ts` |
| `GET /api/health` | `getHealth` | — | `{ status: "ok" }` | — |

`atsScore` is passed into `/api/match` rather than recomputed there,
because the ATS Compatibility Score never depends on the JD — the caller
computes it once via `/api/resume/analyze` and reuses it.

## Conventions

- Every request/response body is a named type in `src/api/types.ts` or
  `src/types`, never `any`.
- Every function returns `Promise<ApiResult<T>>` —
  `{ ok: true, data }` or `{ ok: false, error: { code, message } }` — so
  validation failures are handled the same way a real HTTP error response
  would be, without throwing for expected failures.
- No endpoint logs resume or JD content (see privacy notes in
  `docs/product/v1-scope.md`).
- No endpoint requires authentication in V1.

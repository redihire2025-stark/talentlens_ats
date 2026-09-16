# API Spec

> Status: skeleton written in TASK-001 (project setup). Endpoints are
> implemented incrementally alongside the engine they front, starting
> TASK-004; the API layer itself is wired up in TASK-012.

## How these endpoints are implemented in V1

See "Why no separate backend app in V1" in `docs/architecture/overview.md`.
Each route below has a corresponding function in `src/api/` with the same
request/response shape; for V1 that function calls into `src/lib/*`
in-process instead of making an HTTP request. The contract is fixed now so
switching to a real network call later doesn't change any caller.

## Endpoints

| Method & path | Request | Response | Backed by |
| --- | --- | --- | --- |
| `POST /api/resume/parse` | resume file | `Resume` JSON | `src/lib/parsers` |
| `POST /api/resume/analyze` | `Resume` JSON | ATS Compatibility Score + breakdown | `src/lib/ats` |
| `POST /api/jd/parse` | JD text | `JobDescription` JSON | `src/lib/parsers` |
| `POST /api/match` | `Resume` + `JobDescription` | JD Match Score, matched/missing/partial skills | `src/lib/matching` |
| `POST /api/recommendations` | `Resume` + analysis results | Recommendation list | `src/lib/recommendations` |
| `POST /api/resume/optimize` | `Resume` + accepted recommendations | Updated `Resume` JSON + new `ResumeVersion` | `src/lib/resume-generation` |
| `POST /api/resume/export` | `Resume` version + format (`pdf`\|`docx`) | Exported file | `src/lib/resume-generation` |
| `GET /api/health` | — | `{ status: "ok" }` | — |

## Conventions

- Every request/response body is a named type in `src/types`, never `any`.
- Validation errors return a structured error with a human-readable
  message — never a raw stack trace or generic 500 with no context.
- No endpoint logs resume or JD content (see privacy notes in
  `docs/product/v1-scope.md`).
- No endpoint requires authentication in V1.

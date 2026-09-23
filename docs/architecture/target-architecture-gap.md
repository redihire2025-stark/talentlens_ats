# Target Architecture Gap

`docs/product/target-architecture-prd.md` describes where TalentLens should
evolve toward: a real backend, PostgreSQL, object storage, authentication,
and a deployed AI provider. This sandbox has **no database server, no
deployment target, and no credentials for any of that** — and `AGENTS.md`
requires this repository to stay a single root-level Vite + React app, not
a monorepo. This document says, plainly, what the PRD asks for that isn't
implemented here, why, and exactly where in the current code the seam for
it already is — following the same reasoning `docs/architecture/overview.md`
already applies to "Why no separate backend app in V1".

## What's implemented now (client-side, achievable in this sandbox)

Everything in the target PRD that's expressible as pure, deterministic
logic over parsed data has been implemented or reorganized to match it:

- JD schema expansion + prose requirement extraction (PRD §9) —
  `src/lib/parsers/jd/`, `docs/architecture/jd-parser.md`.
- Match result shape (PRD §12) — `src/lib/matching/types.ts`,
  `docs/scoring/matching-rules.md`.
- Resume Health / ATS Readiness re-categorized into the PRD §11 categories,
  including a new Risk & Consistency analyzer — `src/lib/ats/`,
  `docs/scoring/scoring-methodology.md`.
- Recommendation model (PRD §15) — `src/lib/recommendations/types.ts`.
- Job Match Score weighting (PRD §13) — already matched;
  `src/lib/matching/scoringConfig.ts`.
- API contract alignment (PRD §19) — `src/api/*` now covers
  suggestions accept/reject, versions, and tailor, in addition to what
  already existed; `docs/api/api-spec.md`.
- Terminology — "Resume Health / ATS Readiness" and "Job Match Score"
  throughout the UI and docs.

## What genuinely requires infrastructure this sandbox doesn't have

| PRD ask | Why it isn't built here | Where the seam already is |
| --- | --- | --- |
| **PostgreSQL persistence** (users, resumes, resume_versions, analyses, match_results, recommendations, …) | No database server is reachable from this sandbox, and there's nothing to connect a connection string to even if one were configured — provisioning a real Postgres instance is an infrastructure/hosting decision for whoever deploys this, not something achievable inside a code change here. | `src/stores/*` (Zustand) hold exactly the shape §17's tables describe, in memory. `src/api/*` already returns/accepts the same request/response shapes a real `/api/resumes`, `/api/resumes/:id/versions`, etc. would — persisting instead of holding in memory is a change *inside* those functions (swap the in-process call for a real query), not a change to any caller. |
| **Object storage** for uploaded PDF/DOCX and generated exports | No object storage bucket/credentials exist in this environment, and there's no backend process to hold a signed-upload flow between. | `src/lib/resume-generation/exportDocx.ts` / `exportPdf.ts` already produce the exact `Blob` a real upload-to-storage step would receive; `src/api/resumeExport.ts` is the seam where "return a blob to the browser" becomes "upload to storage and return a URL". |
| **A real Node/Express (or similar) backend process** | Running a second, always-on server process is exactly what `AGENTS.md`'s single-app constraint rules out for this repository, and there's no deployment target here to run it on regardless. | `docs/architecture/overview.md`'s "Why no separate backend app in V1" already covers this in depth: every engine that would live in `apps/api/src/modules/*` already lives in `src/lib/*` as framework-free TypeScript, and `src/api/*` is already endpoint-shaped (one function per route, same request/response types the spec lists) — moving those functions behind real HTTP handlers (e.g. Netlify Functions, following the pattern the new `netlify/functions/rewrite-bullet.ts` proxy already establishes) is a change local to that folder. |
| **Authentication** (users, sessions, `User → Resumes` ownership) | No auth provider is configured in this sandbox, and without persistence (above) there's nothing durable for a session to attach to yet. | The PRD itself (§21) says auth "should not block the first functional MVP" and to build the core engines independent of it — which is already true here: nothing in `src/lib/*` or `src/api/*` reads or requires a user identity. Adding auth later means adding a session/user concept around the existing stores, not changing the engines. |
| **A deployed AI provider as a scoring dependency** | Out of scope by the PRD's own architecture principles (§3: "No LLM responsible for the core score"), not just an infra limitation — this one is a deliberate design choice, not a gap. | The one AI feature that exists (bullet-rewrite suggestions) already runs through a server-side proxy (`netlify/functions/rewrite-bullet.ts`) that holds the only API key, exactly the pattern a fuller AI provider layer (`packages/ai/` in the PRD's target layout) would extend — see `docs/architecture/overview.md`'s "AI Layer" section. |
| **Background queue (Redis + BullMQ)** | Nothing in this app currently takes long enough to need one — parsing, scoring, and matching are all synchronous, in-memory, and fast; the PRD itself (§20) says to add a queue only once something is "slow enough to require asynchronous execution", not up front. | If AI generation or document rendering ever becomes slow enough to matter, the seam is the same `src/api/*` functions: today they `await` their work in-process; a queued version would enqueue a job and return a job id instead, without changing what `src/lib/*` does internally. |

## What this means in practice

None of the above is faked, stubbed, or scaffolded — there is no empty
`apps/api/` or `packages/*` folder in this repository, because that would
contradict `AGENTS.md`'s single-app requirement while adding dead code
nothing runs. Instead, every module boundary the target architecture would
need (`src/api/*` for the backend boundary, `src/lib/*` for the domain
packages, `src/lib/ai/` + the new `netlify/functions/` for the AI provider
layer, `src/stores/*` for the eventual database-backed entities) already
exists in the shape the PRD describes, holding its state in memory or a
serverless function instead of a persistent service. Moving to real
infrastructure later is additive work inside those existing boundaries, not
a rewrite.

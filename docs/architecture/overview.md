# Architecture Overview

## What TalentLens is

TalentLens turns an uploaded resume into a structured, typed model, scores
its ATS compatibility deterministically, and (optionally) matches it against
a job description. V1 is anonymous and session-only: nothing is persisted
server-side, and no LLM call is a hard dependency of the scoring pipeline.

## Data flow

```
Resume file (PDF/DOCX)
    │
    ▼
Parser  ──────────────────►  Structured Resume JSON
    │                              (src/types)
    ▼
Normalization  (skills, titles, keywords → canonical form)
    │
    ▼
Deterministic Analysis
    │
    ├──► ATS Engine  ──────► ATS Compatibility Score + breakdown
    │
    └──► (if JD provided)
              │
              ▼
        JD text ──► Parser ──► Structured JD JSON
              │
              ▼
        Matching Engine (exact → normalized → synonym → fuzzy → [semantic])
              │
              ▼
        Score Engine ──► JD Match Score, matched/missing/partial skills
                              │
                              ▼
                       Recommendation Engine ──► accept/reject/edit
                              │
                              ▼
                       Updated Resume JSON ──► new Resume Version
                              │
                              ▼
                       Recalculated scores, Export (PDF/DOCX)
```

Every arrow above is a pure function boundary: given the same input, each
stage produces the same output. There is no `Resume + JD → LLM → Score` path
anywhere in this pipeline (see "No hard LLM dependency" below).

## Directory layout

| Path | Responsibility |
| --- | --- |
| `src/types` | Shared TypeScript schemas (Resume, JobDescription, scores, API contracts) |
| `src/lib/parsers` | PDF/DOCX → Resume JSON, JD text → JD JSON |
| `src/lib/normalization` | Skill/title/keyword canonicalization (`skillDictionary`, `skillSynonyms`, `titleSynonyms`) |
| `src/lib/ats` | ATS Compatibility engine (parseability, sections, formatting, keywords, score calculator) |
| `src/lib/matching` | Resume ↔ JD matching engine and JD match score |
| `src/lib/recommendations` | Evidence-based recommendation generation |
| `src/lib/resume-generation` | Applying accepted edits, versioning, export rendering |
| `src/api` | Endpoint-shaped service functions consumed by the UI (see below) |
| `src/stores` | Zustand state slices (resume, jobDescription, analysis, editor, versions, ui) |
| `src/features/*` | Screen-level UI composed from `src/components` |
| `src/components` | Shared, reusable UI primitives and the current clickable prototype screens |
| `docs/` | Architecture, scoring methodology, matching rules, API spec, product scope |
| `tests/` | Cross-cutting tests (smoke tests, integration); engine unit tests live next to their module under `src/lib/**` |

## Why no separate backend app in V1

The product brief's target architecture is a monorepo with an
`apps/web` frontend and an `apps/api` Node/REST backend under a shared
`packages/*` set of libraries. This repository, however, runs inside Figma
Make as a single Vite + React app: the dev server, HMR, and preview panel
are wired to a root-level `package.json`/`vite.config.ts`/`index.html` that
the platform manages directly (see `AGENTS.md`). Splitting into a real
multi-package workspace here would fight that harness for no benefit while
V1 has no database and no auth to isolate behind a network boundary.

Instead:

- The engines described as `apps/api/src/*` in the brief live under
  `src/lib/*` as plain, framework-free TypeScript modules.
- The REST endpoints described in `docs/api/api-spec.md`
  (`POST /api/resume/parse`, etc.) are implemented as typed functions in
  `src/api/*` that call straight into `src/lib/*` in-process.
- Because `src/api/*` is endpoint-shaped (one function per route, same
  request/response types as the spec), moving to real HTTP handlers —
  e.g. Netlify Functions at deploy time — later is a change local to that
  folder. Callers (`src/features/*`, Zustand actions) and every engine in
  `src/lib` stay untouched.

If this project is ever developed outside Figma Make (e.g. a plain Netlify
+ GitHub deployment target), `src/api` is the seam where `packages/*` could
be extracted into real npm workspace packages without touching engine logic.

## No hard LLM dependency

The ATS and matching engines are 100% deterministic: same input, same
output, no network call. Optional AI/semantic enhancements are introduced
only behind interfaces (`SemanticMatcher`, `RecommendationProvider`), so a
deterministic implementation always exists and any AI-backed implementation
is swappable without changing the engines that consume it.

## Screens vs. routing

The existing prototype (`src/App.tsx`) navigates between screens with a
single `useState<View>` rather than a router, since V1 has no deep-linkable
state to preserve (no accounts, no saved sessions). `src/routes/` is a
placeholder for if/when that changes.

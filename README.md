# TalentLens

**Smarter Resume & Talent Matching.**

TalentLens is a resume intelligence and job-matching platform. Upload a
resume, get a deterministic ATS Compatibility Score with a full breakdown,
optionally match it against a job description, accept or edit evidence-based
recommendations with your score recalculating live, keep a full version
history, and export a real PDF or DOCX — all without creating an account.
V1's full pipeline (TASK-001 through TASK-020) is implemented end to end.

V1 targets job seekers. Recruiter functionality is architecturally possible
later but not built in V1. See `docs/product/v1-scope.md` for the full
scope, and `docs/architecture/overview.md` for how the pieces fit together.

## Getting started

```bash
pnpm install
pnpm dev      # starts the Vite dev server (already running automatically in Figma Make)
pnpm test     # runs the Vitest suite
pnpm build    # production build
```

Copy `.env.example` to `.env` if you need to override any variable — V1
requires none by default.

## Project structure

```
src/
  types/       Shared TypeScript schemas (Resume, JobDescription, scores)
  lib/         Deterministic engines: parsers, normalization, ats, matching,
               recommendations, resume-generation
  api/         Endpoint-shaped service functions consumed by the UI
  stores/      Zustand state slices
  features/    Screen-level UI (resume, job-description, ats-analysis,
               resume-editor, reports)
  components/  Shared UI primitives and the current prototype screens
  hooks/       Reusable React hooks
docs/          Architecture, scoring methodology, matching rules, API spec,
               product scope
tests/         Cross-cutting tests (engine unit tests live next to their
               module under src/lib/**)
```

Every new directory above that doesn't yet have real code contains a
`README.md` explaining its purpose and which task adds real content to it —
see `AGENTS.md`'s implementation order.

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Vitest + React
Testing Library. No backend service, database, or authentication in V1 —
see `docs/architecture/overview.md` for why and how that boundary is kept
swappable for later.

## Hardening

A top-level error boundary (`src/components/ErrorBoundary.tsx`) catches
unexpected render errors so a bug never leaves the user on a blank white
screen. Parser warnings (a very short document, no skills section found,
etc.) surface directly on the ATS dashboard rather than being silently
discarded. No resume/JD content is ever logged, stored in browser storage,
or rendered via `dangerouslySetInnerHTML`.

## Privacy

Resumes and job descriptions are processed in memory for the current
session only. Nothing is persisted, logged, or sent to a third party by the
core engine. See the privacy principles in `docs/product/v1-scope.md`.

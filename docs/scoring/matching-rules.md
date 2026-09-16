# Matching Rules

> Status: skeleton written in TASK-001 (project setup). Filled in with real
> module behavior as `src/lib/normalization` and `src/lib/matching` are
> implemented in TASK-007 and TASK-009.

## Matching layers

Matching a resume concept against a JD requirement is attempted in order,
stopping at the first confident match:

1. **Exact match** — identical strings after trimming/casing.
2. **Normalized match** — both sides run through `src/lib/normalization`
   (e.g. `React.js`, `React JS`, `ReactJS` → `react`).
3. **Synonym match** — known equivalent terms (`Node` / `Node.js` /
   `NodeJS` → `node.js`; `Postgres` / `PostgreSQL` → `postgresql`; `AWS` /
   `Amazon Web Services` → `aws`).
4. **Fuzzy match** — small edit-distance / phrase-overlap tolerance, used
   conservatively (e.g. `"REST API development"` recognized as related to
   `"RESTful API"`).
5. **Optional semantic match** — behind the `SemanticMatcher` interface;
   not implemented by default, never required for a match to succeed.

A concept is only "demonstrated" when one of these layers produces a
confident match — vague word overlap alone is not sufficient. Being overly
aggressive is treated as a bug: a false "matched" is worse than a
conservative "missing" or "partial", because it would mislead the user
about what their resume actually shows.

## Result categories

- **Matched** — clear evidence in the resume.
- **Partial** — related or adjacent evidence, but not a full match (e.g.
  JD asks for GraphQL, resume shows only general API design).
- **Missing** — no evidence found. Never fabricated, and never silently
  treated as present.

## Experience matching

Beyond skill keywords, experience matching considers:

- Years of experience (parsed from date ranges) vs. the JD's stated range
- Relevant job titles (via `titleSynonyms`)
- Relevant responsibilities (via `responsibilityMatcher`)
- Skill evidence within experience bullets, not just the skills list
- Seniority signals

Example: JD asks for "5+ years React", resume shows "6 years frontend
development with React" → strong evidence, matched. JD asks for "Docker"
and the resume has no Docker evidence anywhere → missing, and the system
never infers Docker experience from adjacent skills (e.g. Kubernetes) no
matter how related they seem.

## What this system will not do

- It will not mark something "matched" because it merely sounds similar.
- It will not fabricate resume content to close a gap — closing gaps is the
  recommendation engine's job, and only ever by rephrasing/highlighting
  what the candidate already stated (see product principles in
  `docs/product/v1-scope.md`).

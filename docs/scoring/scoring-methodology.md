# Scoring Methodology

> Status: skeleton written in TASK-001 (project setup). Filled in with real
> module behavior as `src/lib/ats` and `src/lib/matching` are implemented in
> TASK-008 through TASK-010.

## Terminology

TalentLens reports an **ATS Compatibility Score** and, when a job
description is supplied, a **JD Match Score**. Neither score claims to
reproduce the exact proprietary algorithm of any specific commercial ATS
vendor — they measure compatibility with common ATS-style parsing and
screening patterns, and are always shown with a full breakdown rather than
a bare number.

## ATS Compatibility Score — what it evaluates

- Parseability (can the document be reliably extracted at all)
- Presence and structure of required sections (contact, summary,
  experience, education, skills)
- Contact information completeness
- Skill extraction quality
- Keyword usage relative to common role expectations
- Job title clarity
- Experience entry structure (dates, titles, companies)
- Education entry structure
- Formatting risks: tables, images, headers/footers, columns, unusual
  characters
- Content clarity

Each category is computed by its own module in `src/lib/ats/` (single
responsibility per file — see `src/lib/ats/README.md`), and every module
must return an explanation, not just a number.

## Score weighting

Weights are product configuration, not universal ATS truth, and live in one
place rather than scattered across modules (`src/lib/ats/scoreCalculator.ts`
once implemented). Starting configuration:

| Component | Weight |
| --- | --- |
| Required skills | 0.25 |
| Preferred skills | 0.10 |
| Experience | 0.15 |
| Responsibilities | 0.15 |
| Title | 0.10 |
| Education | 0.05 |
| Keywords | 0.10 |
| ATS compatibility | 0.10 |

## Response shape

Every score calculation returns:

```ts
{
  score: number // 0-100
  breakdown: Record<string, number>
  matched: string[]
  missing: string[]
  partial: string[]
  explanations: string[]
}
```

## Determinism

Given the same Resume JSON (and, for JD match, the same JD JSON), the score
must be identical on every run. No score calculation may depend on network
calls, randomness, or wall-clock time. This is enforced by unit tests
(TASK-010, TASK-019).

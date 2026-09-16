# Scoring Methodology

> The ATS Compatibility Score section below reflects the real
> implementation (TASK-008, `src/lib/ats/`). The JD Match Score's weighting
> is implemented in TASK-009/TASK-010 and documented separately once built.

## Terminology

TalentLens reports an **ATS Compatibility Score** and, when a job
description is supplied, a **JD Match Score**. Neither score claims to
reproduce the exact proprietary algorithm of any specific commercial ATS
vendor — they measure compatibility with common ATS-style parsing and
screening patterns, and are always shown with a full breakdown rather than
a bare number.

## ATS Compatibility Score — what it evaluates

The score is resume-only — it never requires a job description (that's the
JD Match Score, below). It's computed entirely from the *parsed* `Resume`
plus the parser's own warnings (TASK-004), not from the original file
bytes — see "Why formatting analysis is inferred, not direct" below. Seven
categories, one analyzer module each (`src/lib/ats/`):

| Category | Module | What it checks |
| --- | --- | --- |
| Parsing | `parsingAnalyzer.ts` | Did the document extract cleanly, per the parser's own warnings? |
| Sections | `sectionAnalyzer.ts` | Are the sections a screener needs present (name, contact, summary, skills, experience, education), weighted by importance? |
| Keywords | `keywordAnalyzer.ts` | How many distinct, normalized skill keywords does the resume surface (richness, not a match against any specific JD)? |
| Experience | `experienceStructureAnalyzer.ts` | Does each experience entry have a title, company, dates, and bullet points? |
| Skills Evidence | `skillsEvidenceAnalyzer.ts` | Is each listed skill also mentioned in an experience/project bullet, not just the skills list? |
| Formatting | `formattingAnalyzer.ts` | Parser warnings suggesting a hard-to-read document, and paragraph-style (non-bulleted) experience entries |
| Content Quality | `contentQualityAnalyzer.ts` | Do bullets start with strong action verbs and include quantifiable metrics; is a summary present? |

Every analyzer returns a 0-100 score, a list of strengths, a list of
issues, and a one-sentence explanation (`AnalyzerResult` in
`src/lib/ats/types.ts`) — never just a number. `analyzeAtsCompatibility.ts`
runs all seven and assembles the shared `ScoreResult` shape.

### Why formatting analysis is inferred, not direct

A real ATS formatting risk list includes tables, embedded images, and
headers/footers — none of which are visible once a document has been
reduced to extracted text. The ATS engine deliberately only receives the
parsed `Resume` (per the architecture's Resume → Parser → Structured JSON →
Analysis flow), not the original file, so `formattingAnalyzer.ts` infers
risk from what *is* available: parser warnings (a scanned/image-based
document usually produces very little or no extractable text) and the
absence of bulleted experience entries. This is a documented, deliberate
trade-off — see `docs/architecture/resume-parser.md`.

## Score weighting

Weights are product configuration, not universal ATS truth, and live in one
place rather than scattered across modules. The ATS Compatibility Score's
internal weights (`src/lib/ats/scoringConfig.ts`):

| Category | Weight |
| --- | --- |
| Parsing | 0.20 |
| Sections | 0.20 |
| Keywords | 0.15 |
| Experience | 0.15 |
| Skills Evidence | 0.10 |
| Formatting | 0.10 |
| Content Quality | 0.10 |

The JD Match Score (once a job description is supplied) combines a
different set of components — required/preferred skills, experience,
responsibilities, title, education, keywords, and this ATS Compatibility
Score as one input — using its own weight configuration, built in
TASK-009/TASK-010:

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

# Scoring Methodology

> This reflects the real implementation: the ATS Compatibility Score
> (TASK-008, `src/lib/ats/`) and the JD Match Score (TASK-009/TASK-010,
> `src/lib/matching/`).

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
different set of components using its own weight configuration
(`src/lib/matching/scoringConfig.ts`):

| Component | Weight | How it's scored |
| --- | --- | --- |
| Required skills | 0.25 | Average of matched=100/partial=50/missing=0 across `jobDescription.requiredSkills` |
| Preferred skills | 0.10 | Same, across `preferredSkills` |
| Experience | 0.15 | `matchExperience` status (100/50/0); 100 if the JD stated no requirement |
| Responsibilities | 0.15 | Average across `matchResponsibilities` entries |
| Title | 0.10 | `matchTitle` status; 100 if the JD stated no title |
| Education | 0.05 | `matchEducation` status; 100 if the JD listed no education requirement |
| Keywords | 0.10 | Average across matching `jobDescription.keywords` the same way as skills |
| ATS compatibility | 0.10 | The resume's ATS Compatibility Score, computed independently (it never depends on the JD) |

A category the JD didn't actually require (no title stated, no experience
range given, no education line) scores 100 for that category rather than
being penalized — an absent requirement isn't a resume gap.

**Known overlap**: because the JD parser (TASK-006) currently derives
`keywords` as the deduplicated union of `requiredSkills` and
`preferredSkills` (see `docs/architecture/jd-parser.md`), the "Keywords"
component is presently highly correlated with the two skills components
rather than an independent signal. This is an honest V1 limitation, not a
scoring bug — mining additional keywords from JD prose (responsibilities,
requirements sentences) is future work for the JD parser/normalization
engine, not something the score engine should compensate for by guessing.

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

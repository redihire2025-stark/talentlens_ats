# Scoring Methodology

> This reflects the real implementation: the Resume Health / ATS Readiness
> score (`src/lib/ats/`) and the Job Match Score (`src/lib/matching/`). See
> `docs/product/target-architecture-prd.md` §11-§13 for the target this was
> reorganized toward.

## Terminology

TalentLens reports a **Resume Health / ATS Readiness score** and, when a
job description is supplied, a **Job Match Score**. Neither score claims to
reproduce the exact proprietary algorithm of any specific commercial ATS
vendor — they measure compatibility with common ATS-style parsing and
screening patterns, and are always shown with a full breakdown rather than
a bare number.

## Resume Health / ATS Readiness score — what it evaluates

The score is resume-only — it never requires a job description (that's the
Job Match Score, below). It's computed entirely from the *parsed* `Resume`
plus the parser's own warnings, not from the original file bytes — see "Why
formatting analysis is inferred, not direct" below. Seven product
categories (PRD §11), one analyzer module each (`src/lib/ats/`):

| Category | Module(s) | What it checks |
| --- | --- | --- |
| ATS Essentials | `parsingAnalyzer.ts` | Did the document extract cleanly, per the parser's own warnings? |
| Resume Structure | `sectionAnalyzer.ts` | Are the sections a screener needs present (name, contact, summary, skills, experience, education), weighted by importance? |
| Content Quality | `contentQualityAnalyzer.ts` | Do bullets start with strong action verbs and include quantifiable metrics; is a summary present? |
| Skills & Evidence | `skillsEvidenceAnalyzer.ts` + `keywordAnalyzer.ts` (averaged) | Is each listed skill also mentioned in an experience/project bullet, and how many distinct, normalized skill keywords does the resume surface overall? |
| Experience & Seniority | `experienceStructureAnalyzer.ts` | Does each experience entry have a title, company, dates, and bullet points? |
| Recruiter Readability | `formattingAnalyzer.ts` | Parser warnings suggesting a hard-to-read document, and paragraph-style (non-bulleted) experience entries |
| Risk & Consistency | `riskConsistencyAnalyzer.ts` | Inverted/overlapping employment dates, duplicate-looking entries, malformed links |

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
place rather than scattered across modules. The Resume Health / ATS
Readiness score's internal weights (`src/lib/ats/scoringConfig.ts`):

| Category | Weight |
| --- | --- |
| ATS Essentials | 0.20 |
| Resume Structure | 0.20 |
| Content Quality | 0.15 |
| Skills & Evidence | 0.20 |
| Experience & Seniority | 0.10 |
| Recruiter Readability | 0.10 |
| Risk & Consistency | 0.05 |

The Job Match Score (once a job description is supplied) combines a
different set of components using its own weight configuration
(`src/lib/matching/scoringConfig.ts`) — matching the target architecture
PRD §13's suggested weights exactly:

| Component | Weight | How it's scored |
| --- | --- | --- |
| Required skills | 0.25 | Average of matched=100/partial=50/missing=0 across `jobDescription.requiredSkills` |
| Preferred skills | 0.10 | Same, across `preferredSkills` |
| Experience | 0.15 | `matchExperience` status (100/50/0); 100 if the JD stated no requirement |
| Responsibilities | 0.15 | Average across `matchResponsibilities` entries |
| Title / seniority | 0.10 | `matchTitle` status; 100 if the JD stated no title |
| Education | 0.05 | `matchEducation` status; 100 if the JD listed no education requirement |
| Keywords / domain terms | 0.10 | Average across matching `jobDescription.keywords` the same way as skills |
| Resume Health / ATS Readiness | 0.10 | The resume's Resume Health / ATS Readiness score, computed independently (it never depends on the JD) |

A category the JD didn't actually require (no title stated, no experience
range given, no education line) scores 100 for that category rather than
being penalized — an absent requirement isn't a resume gap.

**Keyword overlap, now reduced**: the JD parser's `keywords` field is still
the deduplicated union of `requiredSkills`/`preferredSkills`, so this
component remains correlated with the two skills components rather than a
fully independent signal — but as of the PRD §9 prose-extraction work
(`src/lib/parsers/jd/extractProseSkills.ts`), `requiredSkills`/
`preferredSkills` themselves now include skills mined from prose, and the
JD's separate `technologies`/`domainTerms`/`softSkills` fields capture
additional prose-only signal that `keywords` does not yet fold in. Folding
those into `keywords` (or scoring them independently) is a reasonable next
step, not attempted here since the scoring weight table above already
matches the PRD and re-weighting without a product decision would be
guessing.

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

## Hard requirements — reported outside the score

A Job Match score never hides a mandatory failure inside a good average.
`matchResume` (`src/lib/matching/`) also returns `hardRequirements`, a flat
✓/✗ list covering the JD's stated minimum years of experience and each
required skill — see `docs/scoring/matching-rules.md`'s "Hard requirements"
section for the full detection rules and what's deliberately not detected.
This list is displayed in its own UI section, never merged into
`breakdown`.

## Recommendation categories added for JD-dependent gaps

Beyond the original six categories, four more (`src/lib/recommendations/`)
turn already-computed match data into recommendations without any new
matching logic of their own:

| Category | Generator | Built from |
| --- | --- | --- |
| `hard-requirement-gap` | `hardRequirementRecommendations.ts` | Each unsatisfied `HardRequirement` above |
| `experience-gap` | `experienceGapRecommendations.ts` | `experienceMatcher.ts`'s own status/years when the JD's minimum isn't met |
| `responsibility-gap` | `responsibilityGapRecommendations.ts` | `responsibilityMatcher.ts`'s `missing` entries |
| `education-gap` | `educationGapRecommendations.ts` | `educationMatcher.ts`'s `missingRequirements` |

A fifth spec category, `certification-gap`, is deliberately not built: the
JD schema's `certifications` field is an unstructured `string[]` with no
matcher comparing it against the resume's own certifications, so a
generator here would have to invent matching logic rather than reuse an
existing result — see `docs/architecture/ats-engine-spec-gap.md`.

In the UI (`src/components/Recommendations.tsx`), all four group under a
new "Critical Requirements" section, ordered first, so a hard-requirement
or gap-level recommendation is never visually indistinguishable from a
routine wording suggestion.

## Score-change explanation

`src/lib/scoring/explainScoreChange.ts` is a pure diff utility — never a new
scoring calculation — over two already-computed `ScoreResult.breakdown`
objects (Resume Health's 7 categories, or Job Match's 8 components when a
JD is active). `diffScoreBreakdown` returns each changed category's
before/after/delta, sorted by magnitude; `formatScoreChange` renders the
spec §48 example phrasing ("+5 Required Skill Coverage, +2 Responsibility
Alignment, -1 Risk/Consistency"). `src/components/BeforeAfter.tsx` uses it
to show *why* a score changed between two saved resume versions, not just
the two numbers — `src/stores/versionsStore.ts`'s `ResumeVersion.scoreSnapshot`
now also stores each version's breakdown for this purpose.

## Determinism

Given the same Resume JSON (and, for JD match, the same JD JSON), the score
must be identical on every run. No score calculation may depend on network
calls, randomness, or wall-clock time. This is enforced by unit tests
(TASK-010, TASK-019).

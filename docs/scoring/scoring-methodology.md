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

Every analyzer returns an `AnalyzerResult` (`src/lib/ats/types.ts`): a
0-100 score, strengths, issues, a one-sentence explanation, and the
evidence the score is based on. `analyzeAtsCompatibility.ts` runs all
seven in `ATS_SCORE_CATEGORIES` order and turns each result into one
`ScoreComponent` (see "Response shape" below).

Evidence per category:

| Category | Evidence |
| --- | --- |
| ATS Essentials | none. The score comes from parser warnings, not resume text. |
| Resume Structure | Literal quotes for name, contact, and summary. `inferred-from-structure` observations for section presence ("1 experience entry detected."), because a section's existence isn't a quote of anything. |
| Content Quality | The bullets that already pair an action verb with a measurable detail. |
| Skills & Evidence | For each listed skill with bullet support, the first bullet that mentions it. |
| Experience & Seniority | The meta lines of each fully structured entry. |
| Recruiter Readability | none. The signals are absences (no bullets) or parser warnings. |
| Risk & Consistency | The meta lines of flagged entries, and any malformed link. |

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
the union of `requiredSkills`/`preferredSkills`, deduplicated by canonical
term (so neither a skill listed in both lists nor a skill written two
different ways is counted twice), so this
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

Both scores return `ScoreResult<Category>` (`src/types/score.ts`, spec
§53):

```ts
interface ScoreComponent<Category> {
  category: Category
  rawScore: number       // the category's own 0-100 score
  weight: number         // from the scoring config; one breakdown's weights sum to 1
  weightedScore: number  // rawScore * weight: this category's points toward the overall score
  explanation: string
  evidence: Evidence[]
}

interface ScoreResult<Category> {
  score: number                           // round(clamp(sum of weightedScore, 0, 100))
  breakdown: ScoreComponent<Category>[]   // one per category, in the config's fixed order
  matched: string[]
  missing: string[]
  partial: string[]
  explanations: string[]                  // breakdown[i].explanation, in order
}
```

The overall score is `totalWeightedScore(breakdown)`
(`src/lib/scoring/scoreComponents.ts`) and nothing else, so every point is
traceable to a component, its weight, and its explanation. The dashboards
show each component's `rawScore` as the category percentage. The ATS
dashboard also shows how many points the component contributes ("contributes
12.8 of 15 pts"), and the Job Match breakdown shows each component's weight,
explanation, and contribution. `weightedScore` is stored unrounded and
rounded only for display, so the overall rounding happens once.
`getScoreComponent(breakdown, category)` and
`rawScoresByCategory(breakdown)` give keyed access to the ordered array.

Job Match component evidence is the typed evidence of the matched and
partial entries in that category: the skills-list line and backing
bullets for a matched skill, the best-overlapping bullet for a
responsibility, the matched role's title line, and the matched education
entry. Missing entries contribute none. The `atsCompatibility` component
has no evidence of its own, because its evidence is the Resume Health
breakdown.

## Hard requirements — reported outside the score

A Job Match score never hides a mandatory failure inside a good average.
`matchResume` (`src/lib/matching/`) also returns `hardRequirements`, a flat
✓/✗ list. It covers the JD's stated minimum years of experience, each
required skill, each required education line, and the JD's stated
location. See the "Hard requirements" section of
`docs/scoring/matching-rules.md` for the detection rules and for the three
spec types that are deliberately not detected. The list is shown in its
own UI section with each requirement's evidence, and is never merged into
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
| `education-gap` | `educationGapRecommendations.ts` | `educationMatcher.ts`'s per-requirement results that aren't `matched`, reusing the matcher's own reason |

A fifth spec category, `certification-gap`, is deliberately not built. JD
certification lines are now typed `JobRequirement`s, but there is still no
matcher comparing them against the resume's certifications, and a
free-text name-similarity comparison could fabricate a "met" credential.
See `docs/architecture/ats-engine-spec-gap.md`.

Every `Recommendation.evidence` is `Evidence[]`. Each generator supplies
the evidence it actually has:

- the bullet entity, for bullet-impact
- the matcher's evidence, for JD gaps (for example, a partially related
  skill, or the degree in another field that makes an education
  requirement only partly met)
- the role's meta line, for formatting
- the skills-list line, for a listed-only skill

Recommendations about something the resume *lacks* (a missing section, a
missing skill, a missing responsibility) have none. Bullet-level
`location`s carry the stable `entryId`/`bulletId` alongside the positional
indexes, and accepting a recommendation resolves its target by id.

In the UI (`src/components/Recommendations.tsx`), all four group under a
new "Critical Requirements" section, ordered first, so a hard-requirement
or gap-level recommendation is never visually indistinguishable from a
routine wording suggestion.

## Score-change explanation

`src/lib/scoring/explainScoreChange.ts` is a pure diff utility, never a
new scoring calculation. It compares two already-computed
`ScoreComponent[]` breakdowns (Resume Health's 7 categories, or Job
Match's 8 components when a JD is active) by category. For each changed
category, `diffScoreBreakdown` returns:

- `before` / `after` / `delta` on the category's own 0-100 `rawScore`
- `weight`
- `weightedDelta`: how many points of the *overall* score that change
  accounts for

Entries are sorted by magnitude. `formatScoreChange` renders the spec §48
example phrasing ("+5 Required Skill Coverage, +2 Responsibility
Alignment, -1 Risk/Consistency"). `src/components/BeforeAfter.tsx` shows
both numbers ("+5 Content Quality (+0.8 pts overall)") so a user can see
why a score changed between two saved versions, not just the two totals.
`ResumeVersion.scoreSnapshot` stores each version's component breakdowns
for this purpose.

## Determinism

Given the same Resume JSON (and, for JD match, the same JD JSON), the score
must be identical on every run. No score calculation may depend on network
calls or randomness. Parsed documents contain no timestamps and no random
ids: `Resume.id` and `JobDescription.id` are content hashes, and entity
ids are positional. Per-module determinism tests cover this, and
`src/api/determinism.test.ts` covers the full pipeline, from raw resume
and JD text through recommendations, run twice and compared with
`toEqual`.

One known clock dependence predates this rewrite and remains. An experience
entry with no end date is measured up to *today*: `calculateYearsOfExperience`
and `riskConsistencyAnalyzer.ts`'s overlap check both use `Date.now()` /
`new Date()`. Repeated runs within a session agree, but the same resume
analyzed on a later day can show more years of experience. Removing this
would mean passing an explicit "as of" date through the matching and
Resume Health entry points. That is a small follow-up, and it is listed in
`docs/architecture/ats-engine-spec-gap.md`.

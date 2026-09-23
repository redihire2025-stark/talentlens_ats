# ATS Engine Spec Gap

`docs/product/ats-engine-spec.md` is the user-supplied "ATS Intelligence
Engine Development Specification" — the next layer on top of
`docs/product/target-architecture-prd.md`, whose own gap is documented in
`docs/architecture/target-architecture-gap.md`. This document says, in the
same honest style, what the new spec asks for that already matches the
current implementation, what this pass implemented, and what's deliberately
deferred as a separate, larger refactor — not attempted blind in one pass,
per that prior document's own "Final Implementation Rule" (target
architecture PRD §26), which still applies here.

## What already matched the new spec before this pass

Most of the new spec's *behavioral* requirements (§1, §12-27, §30-37,
§42-49, §56-61) were already implemented by the target-architecture work,
under different but equivalent naming:

- **Deterministic-first scoring, AI never scores** (§1, §42-44) —
  `netlify/functions/rewrite-bullet.ts` is the only AI call in the system,
  and it only rewrites bullet text after a deterministic recommendation
  already exists; the score is always computed from the actual resume, see
  `src/lib/ai/`.
- **5-layer matching order** (§13-19) — exact → normalized → synonym →
  fuzzy → optional semantic, `src/lib/matching/`, `docs/scoring/matching-rules.md`.
- **`MatchResult`-shaped output** (§19) — `SkillMatchEntry` in
  `src/lib/matching/types.ts` already carries
  `requirement/skill/status/matchType/confidence/evidence/reason`, the same
  fields as the spec's `MatchResult`, just under the name this codebase
  already used.
- **Job Match weights** (§20-27) — `src/lib/matching/scoringConfig.ts`
  already has the spec's exact 25/10/15/15/10/5/10/10 weighting.
- **Resume Health weights** (§30-37) — `src/lib/ats/scoringConfig.ts`
  already has the spec's exact 20/20/15/20/10/10/5 weighting, one analyzer
  module per category.
- **Recommendation model** (§38-41) — `Recommendation` in
  `src/lib/recommendations/types.ts` already has
  `id/category/severity/issue/evidence/explanation/suggestedChange/
  confidence/source/requiresUserInput/status` field-for-field.
- **JD prose extraction** (§9 of the prior PRD, referenced by this spec) —
  `src/lib/parsers/jd/extractProseSkills.ts` mines requirements from
  free text, not just explicit bullet lists.
- **AI key server-side only** (§58) — `netlify/functions/rewrite-bullet.ts`
  holds the only key; the browser never sees it.
- **Absent-requirement rule** (§28) — `scoreEntries`/`scoreSingleResult` in
  `src/lib/matching/categoryScores.ts` already score an empty/unstated JD
  category as 100, never a penalty.

## What this pass implemented

1. **Hard requirements** (§11, §29) — `HardRequirement` type added to
   `src/lib/matching/types.ts`; `src/lib/matching/hardRequirements.ts`
   detects `minimum-experience` (from `experience.minimumYears`) and
   `required-skill` (one per `jobDescription.requiredSkills`), both by
   reusing `matchExperience`/`matchSkills`'s own results rather than
   re-implementing matching. Exposed as `MatchAnalysis.hardRequirements`
   (`matchResume.ts`) and shown as its own "Hard Requirements" ✓/✗ section
   in `src/components/JDMatch.tsx`, separate from the score breakdown.
2. **New recommendation categories** (§38) — `hard-requirement-gap`,
   `experience-gap`, `responsibility-gap`, `education-gap` added to
   `RecommendationCategory` (`src/lib/recommendations/types.ts`), each with
   its own pure generator file
   (`hardRequirementRecommendations.ts`, `experienceGapRecommendations.ts`,
   `responsibilityGapRecommendations.ts`, `educationGapRecommendations.ts`)
   following the existing `RecommendationDraft`/`toPrdRecommendationFields`
   pattern, wired into `generateRecommendations.ts` and grouped under a new
   "Critical Requirements" section in `Recommendations.tsx`.
   `certification-gap` was **not** added — see "Deliberately not built"
   below.
3. **Score-change explanation** (§48) — `src/lib/scoring/explainScoreChange.ts`
   is a pure diff over two `ScoreResult.breakdown` objects, producing a
   sorted per-category delta list and the spec's example phrasing ("+5
   Required Skill Coverage, +2 Responsibility Alignment, -1
   Risk/Consistency"). `ResumeVersion.scoreSnapshot`
   (`src/types/resumeVersion.ts`) now also stores each saved version's ATS
   and Job Match breakdowns so `src/components/BeforeAfter.tsx` can show
   *why* a score changed, not just the two numbers.
4. **Do-not-do verification** (§61) — checked, not changed, because all
   three already held:
   - `Docker`/`Kubernetes` are separate canonical entries in
     `src/lib/normalization/skillSynonyms.ts`, never merged as equivalent.
   - `src/lib/ats/keywordAnalyzer.ts` counts distinct normalized skills via
     a `Set`, so repeating a keyword never raises the score.
   - `src/lib/matching/experienceMatcher.ts` is already status-based
     (`matched`/`partial`/`missing`, scored 100/50/0 by
     `categoryScores.ts`), so experience far beyond the JD's ask never
     earns unlimited extra credit — it's already bounded, not continuous.

## Deliberately not built: `certification-gap`

The spec's fifth new recommendation category has no reliable signal to
build from yet: `JobDescription.certifications` is an unstructured
`string[]` (`src/types/jobDescription.ts`), and there is no
`certificationMatcher.ts` comparing it against
`Resume.certifications` the way `educationMatcher.ts` compares education.
Building one now would mean inventing new matching logic in the same pass
as everything else here — a name-similarity comparison between two loosely
structured string lists is exactly the kind of thing that risks a false
"matched" or a fabricated gap, which `docs/scoring/matching-rules.md`
already treats as worse than a conservative miss. It's a reasonable next
step (a `certificationMatcher.ts` alongside the existing matchers, following
the same evidence-based pattern), just not one to guess at without the
product deciding what "satisfied" means for a certification requirement
written as free text.

## Deliberately deferred: the full schema rewrite (§3-11)

The new spec's literal schemas add a lot of structure the current
`Resume`/`JobDescription` types don't have. None of it is implemented in
this pass, on purpose:

- **`id` and `metadata`/`parserMetadata` on every entity** — the current
  `Resume`, `ResumeSkill`-equivalent (`Skill`), `ExperienceEntry`, etc. have
  no `id` field at all; every consumer (matchers, analyzers, recommendation
  generators, the editor's `location: { entryIndex, bulletIndex }` scheme)
  currently addresses entries by array position, not by id. Adding `id`
  would touch every one of those call sites plus every fixture in every
  test file — not something to do as a side effect of an unrelated feature
  pass.
- **Typed `Evidence` objects instead of `string[]`** — the spec's
  `Evidence` is `{ text, section, entryId?, sourceType, confidence }`.
  Today, evidence is a plain `string[]` on `SkillMatchEntry.evidence`,
  `Recommendation.evidence`, `HardRequirement.evidence` (added in this
  pass, deliberately kept as `string[]` for the same reason), and the skill
  parser's `Skill.evidence`. Restructuring all of them to typed objects
  means touching every matcher, every analyzer, every recommendation
  generator, and every one of the 350+ existing tests that assert against
  `evidence` as a string array — a genuinely valuable increase in
  precision (it would let the UI show *where* evidence came from), but a
  distinct, separately-reviewable refactor, not a rider on this pass's four
  numbered items.
- **`ExperienceBullet` as its own typed entity** (`id`, `text`,
  `actionVerb`, `metrics`, `technologies`, `responsibilities`,
  `achievements`, `evidence`) — today a bullet is just a `string` inside
  `ExperienceEntry.bullets`. `bulletQuality.ts`, `bulletImpactRecommendations.ts`,
  and the editor's bullet-level location scheme all operate on that string
  directly; promoting bullets to a structured object is a schema change
  with UI and API ripple effects well beyond the four gaps this pass
  targeted.
- **Full `ScoreComponent` wrapping every breakdown entry**
  (`rawScore/weight/weightedScore/explanation/evidence` per category,
  instead of today's `Record<string, number>`) — `calculateJdMatchScore.ts`
  and `analyzeAtsCompatibility.ts` both already compute everything a
  `ScoreComponent` needs (the per-category raw score, the configured
  weight, the weighted contribution, and an explanation string in
  `explanations[]`), just not assembled into one object per category. This
  is a real, additive next step — `explainScoreChange.ts` (added in this
  pass) already benefits from a `ScoreComponent` shape, since today it can
  only diff the raw numbers, not also show each category's *weight* moving
  — but assembling and re-typing every score consumer (six-plus UI
  components, `matchStore`, `analysisStore`, `editorStore`,
  `versionsStore`) around a new `ScoreResult<T>` shape is exactly the kind
  of wholesale rewrite the brief for this pass says not to do blind.
- **`languages`/`awards`/`sections` arrays on `Resume`** — no parser in
  `src/lib/parsers/` currently extracts these; adding the fields without a
  parser to populate them would be a schema change with no real behavior
  behind it.

None of the above blocks anything implemented in this pass — the new
`HardRequirement.evidence` and the four new recommendation generators all
work correctly against the current `string[]`-evidence, position-addressed
schema, exactly as this document's "genuinely bounded gaps" scope intended.

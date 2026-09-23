# ATS Engine Spec Gap

`docs/product/ats-engine-spec.md` is the user-supplied "ATS Intelligence
Engine Development Specification". It builds on
`docs/product/target-architecture-prd.md`, whose own gap is covered in
`docs/architecture/target-architecture-gap.md`. This document compares
the spec with what is implemented now. It covers what matches, where the
implementation deliberately differs from the spec's literal text and why,
and what is still not built.

## Status in brief

The canonical schema rewrite (spec §3-11, §53) that earlier passes
deferred is done. Typed `Evidence`, entity ids, the `ExperienceBullet`
entity, typed `JobRequirement`s, `MatchResult`, `ScoreComponent[]`
breakdowns, the extra `Resume` fields, and four of the seven
hard-requirement types are implemented through every layer, from parser
to UI. `src/api/determinism.test.ts` checks that the whole pipeline stays
deterministic. The schema is documented in
`docs/architecture/resume-schema.md` and `docs/architecture/jd-schema.md`.
Scoring and matching are documented in `docs/scoring/`.

## What matches the spec

- **Principles (§1)**: deterministic-first; AI only rewrites user-approved
  bullet text through `netlify/functions/rewrite-bullet.ts` and never
  determines a score; Resume Health and Job Match are separate scores.
- **Canonical schemas (§3-11)**:
  - `Resume` has `id`, `metadata`, `contact`, `summary`, `skills`,
    `experience`, `education`, `certifications`, `projects`, `languages`,
    `awards`, `sections`, `parserWarnings`, and `parserMetadata`.
  - `ResumeSkill` has `id`, `rawName`, `canonicalName`, `category`,
    `aliases`, `evidence`, `confidence`, and `sources`.
  - `Evidence` has `text`, `section`, `entryId?`, `sourceType`, and
    `confidence`.
  - `ExperienceBullet` has `id`, `text`, `actionVerb?`, `metrics`,
    `technologies`, `responsibilities`, `achievements`, and `evidence`.
  - `JobDescription` requirement fields are typed `JobRequirement[]` /
    `Keyword[]`.
  - `HardRequirement` has all seven types in its union.
- **Matching (§13-19)**: exact → normalized → synonym → fuzzy, with an
  optional `SemanticMatcher` interface that is not wired in. Every skill
  and keyword result is a `MatchResult` with `requirementId`,
  `requirement`, `normalizedTerm`, `status`, `matchType`, `confidence`,
  typed `evidence`, and `reason`.
- **Scoring (§20-37, §53)**:
  - Both scores return one `ScoreComponent` per category (`rawScore`,
    `weight`, `weightedScore`, `explanation`, `evidence`). The overall
    score is exactly the rounded sum of `weightedScore`.
  - The weights match the spec's tables (25/10/15/15/10/5/10/10 and
    20/20/15/20/10/10/5).
  - An absent JD requirement scores 100.
  - Keywords are deduplicated by canonical term, so repetition is never
    rewarded.
- **Hard requirements (§11, §29)**: reported in their own list, with
  evidence, outside the score.
- **Recommendations (§38-41)**: each has the spec's fields, and
  `evidence` is typed `Evidence[]`. Categories include
  `hard-requirement-gap`, `experience-gap`, `responsibility-gap`, and
  `education-gap`.
- **Score-change explanation (§48)**: diffs `ScoreComponent[]` and reports
  each category's delta and its effect on the overall score.
- **Editor and versioning (§45-47)**: editor edits go through the same
  schema builders and scoring engine as initial analysis, and the original
  resume is never mutated.

## Deliberate differences from the spec's literal text

Each of these is a naming or placement choice. None drops information,
and each has a reason:

- **`ExperienceEntry.title`, not `jobTitle`.** The normalized form is named
  `normalizedJobTitle`, as in the spec. Renaming `title` would have touched
  every consumer for no gain in meaning.
- **`ContactInformation.links: CandidateLink[]`**, not separate
  `linkedin`/`github`/`portfolio` fields. Typed links hold the same
  information and allow more than one link of a type.
- **`ProjectEntry.bullets` stays `string[]`.** The spec only defines
  `ExperienceBullet` for experience. Project bullets are used as plain
  text (skill-evidence linking, responsibility matching), and nothing needs
  per-bullet structure there yet.
- **`JobDescription.responsibilities` stays `string[]`.** Responsibilities
  are prose compared by token overlap, so a `canonicalTerm` would have
  nothing meaningful to hold. The match result for each one carries typed
  resume evidence.
- **`hardRequirements` lives on `MatchAnalysis`, not `JobDescription`.** A
  hard requirement's `satisfied`/`evidence`/`reason` only exist once the
  JD is compared against a resume. The JD-side facts they come from are
  typed on the JD.
- **`JobRequirement.evidence` is a string** (the JD line), not `Evidence[]`.
  `Evidence.section` names resume sections, so it can't describe a JD
  line.
- **`RequirementCategory` adds `education` and `certification`** to the
  spec's five values, so JD education and certification lines can use the
  typed shape and be pointed at by a `HardRequirement`.
- **Bullet `technologies` are `ResumeSkill` objects with `category:
  'other'`.** The skill taxonomy has no category data, and inventing one
  per technology would be guessing.
- **`ResumeSkill.aliases` are the taxonomy's known variants** of the
  canonical name, and `confidence` is always 1. Only skills literally
  listed in the resume enter `Resume.skills`. Skills are never inferred
  from bullets.

## Still not implemented

- **Detecting `certification`, `license`, and `work-authorization` hard
  requirements, and the `certification-gap` recommendation.** The types are
  in the union, but no detector guesses at them:
  - JD certification lines are now typed requirements, but they are free
    text with no certification taxonomy. A name-similarity comparison
    against the resume's certifications could report a credential as held
    when it isn't, which is worse than reporting nothing.
  - The JD parser extracts no license or work-authorization requirements,
    and resumes rarely state work authorization.

  A `certificationMatcher.ts` backed by a small certification taxonomy
  (like `skillSynonyms.ts`) is the reasonable next step. It needs a product
  decision on what counts as "satisfied" (for example, whether an expired
  certification counts).
- **`critical` recommendation severity.** The spec's severity scale is
  `critical/high/medium/low`. The implementation derives
  `high/medium/low` from the impact delta. A failed hard requirement is
  already grouped first under "Critical Requirements" in the UI, but the
  `severity` value itself has no `critical` level yet.
- **Clock dependence for ongoing roles.** An experience entry with no end
  date is measured up to "now" (`Date.now()` in
  `calculateYearsOfExperience` and `new Date()` in
  `riskConsistencyAnalyzer.ts`). Runs within a session are identical, and
  all ids and metadata are clock-free, but the same resume analyzed on a
  later day can show more years. This predates the schema rewrite. The fix
  is to pass an explicit "as of" date into the matching and Resume Health
  entry points.
- **Prose-only JD signal isn't scored.** `technologies`, `softSkills`, and
  `domainTerms` are extracted and typed, but the keyword component still
  covers only required and preferred skills (see
  `docs/scoring/scoring-methodology.md`). Scoring them would change the
  spec's weight table, which needs a product decision.
- **Spec §2 file names.** The module boundaries match the spec (parsers,
  normalization, ats, matching, scoring, recommendations, ai,
  resume-generation), but the files inside use this codebase's existing
  names (for example, `skillMatcher.ts` covers the spec's
  exact/normalized/synonym/fuzzy matcher files). This is naming only.

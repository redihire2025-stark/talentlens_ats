# Matching Rules

> This reflects the real implementation: `src/lib/normalization` (TASK-007)
> and `src/lib/matching` (TASK-009).

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

## Match result shape (target architecture PRD §12)

Every skill match (`SkillMatchEntry` in `src/lib/matching/types.ts`) carries
the requirement text, the normalized term, the status, which layer produced
it, a confidence, the supporting evidence, and a plain-language reason —
never just a status:

```ts
{
  requirement: 'GraphQL',   // as written in the JD
  skill: 'graphql',         // normalized term
  status: 'missing',
  matchType: 'none',        // 'exact' | 'normalized' | 'synonym' | 'fuzzy' | 'semantic' | 'none'
  confidence: 1,
  evidence: [],
  reason: 'No evidence of "GraphQL" was found in the resume's skills or bullets.',
}
```

`confidence` is 1 for an exact/normalized match or a confirmed miss (the
matcher is certain either way), and the fuzzy layer's token-overlap ratio
(< 1) for a `partial` match — never a probability estimate for anything
else.

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

## Hard requirements

Alongside the per-category match results above, `matchResume` also returns
`hardRequirements: HardRequirement[]` (`src/lib/matching/hardRequirements.ts`,
per the ATS Intelligence Engine spec §11/§29). A hard requirement is a
pass/fail condition — a missing one must never disappear inside the overall
Job Match score, so it's reported as its own list rather than folded into
`skills`/`experience`. Two types are detected, reusing the matchers above's
already-computed results rather than re-implementing matching logic:

- **`minimum-experience`** — one entry when the JD states
  `experience.minimumYears`, `satisfied` mirroring `matchExperience`'s own
  `matched` status.
- **`required-skill`** — one entry per `jobDescription.requiredSkills`,
  `satisfied` mirroring the corresponding `matchSkills` entry's `matched`
  status (a `partial` skill match counts as an unsatisfied hard
  requirement, since a hard requirement is boolean, not graded).

The spec lists five more types (`certification`, `license`, `education`,
`work-authorization`, `location`); they aren't detected because the current
`JobDescription` schema has no requirement-level field for them with
matching signal comparable to `requiredSkills`/`experience` — see
`docs/architecture/ats-engine-spec-gap.md`.

The UI (`src/components/JDMatch.tsx`'s "Hard Requirements" section) always
shows this list as its own ✓/✗ block, separate from the score breakdown.

## What this system will not do

- It will not mark something "matched" because it merely sounds similar.
- It will not fabricate resume content to close a gap — closing gaps is the
  recommendation engine's job, and only ever by rephrasing/highlighting
  what the candidate already stated (see product principles in
  `docs/product/v1-scope.md`).

## Implementation notes

- **Skills** (`skillMatcher.ts`) collapse layers 2-3 above into one step:
  the normalization dictionary (TASK-007) *is* a synonym table, so
  "React"/"React.js"/"ReactJS" normalizing to the same canonical form
  covers both "normalized" and "synonym" matching at once. The fuzzy layer
  only compares against the resume's own skill list (never arbitrary
  bullet text) to avoid false positives; a precise (non-fuzzy) substring
  check against bullets is what makes "REST API development" satisfy a JD
  asking for "RESTful API" — both normalize to the same "rest api" phrase,
  and the bullet contains that phrase verbatim.
- **Titles** (`titleMatcher.ts`) compare only the core title
  (seniority-stripped) for matched/missing; a seniority difference is
  reported in the explanation rather than failing the match outright.
- **Experience** (`experienceMatcher.ts`) computes years as a calendar
  span (earliest start to latest end/present) rather than summing each
  entry's duration, so overlapping or concurrent roles aren't double
  counted.
- **Responsibilities** (`responsibilityMatcher.ts`) use fuzzy token
  overlap as the *primary* layer, not a last resort — responsibilities are
  full sentences, not canonicalizable terms the way skills are.
- **Education** (`educationMatcher.ts`) treats a JD requirement that
  explicitly says "or equivalent experience" as partially satisfied by
  relevant work experience alone, rather than an automatic miss for a
  candidate without a degree.
- **Semantic matching** (`semanticMatcher.ts`) exists only as the
  `SemanticMatcher` interface plus a `NoopSemanticMatcher` default — per
  the "AI ABSTRACTION" architecture principle, it's not called by
  `matchResume` in V1. A real implementation could be added later without
  changing any of the deterministic matchers above.

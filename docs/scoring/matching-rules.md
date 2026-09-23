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

## Match result shape (spec §19)

Every skill and keyword match is a `MatchResult`
(`src/lib/matching/types.ts`). It carries the requirement's id and text,
the normalized term, the status, which layer produced it, a confidence,
typed evidence, and a plain-language reason. It is never just a status:

```ts
{
  requirementId: 'req-preferred-0',  // the JobRequirement / Keyword id
  requirement: 'GraphQL',            // as written in the JD (rawText)
  normalizedTerm: 'graphql',         // canonicalTerm
  status: 'missing',
  matchType: 'none',                 // 'exact' | 'normalized' | 'synonym' | 'fuzzy' | 'semantic' | 'none'
  confidence: 1,
  evidence: [],                      // Evidence[]; empty when missing
  reason: 'No evidence of "GraphQL" was found in the resume\'s skills or bullets.',
}
```

`matchSkill` takes a typed requirement (`JobRequirement` or `Keyword`) and
compares `canonicalTerm` against each resume skill's `canonicalName`.

| Layer | `confidence` | `evidence` |
| --- | --- | --- |
| exact / normalized (skills list) | 1 | The skill's own evidence: its skills-list line plus every bullet that mentions it |
| synonym (canonical phrase found in a bullet) | 0.9 | That bullet, with `confidence: 0.9` |
| fuzzy (`partial`) | the token-overlap ratio (< 1) | The related skill's name, quoted from the skills list, with the ratio as its confidence |
| missing | 1 (certain there's no evidence) | none |

`confidence` is never a probability estimate. It is either certainty or
the measured overlap.

The other matchers also return typed evidence. `TitleMatchResult` returns
the matched role's title line. `ExperienceMatchResult` returns the meta
lines of the dated roles the years figure was computed from.
`ResponsibilityMatchEntry` returns the best-overlapping bullet, with the
overlap ratio as its confidence. `EducationMatchResult.requirements[]`
returns one result per JD education line: `requirementId`, `status`, the
matched education entry, and a `reason`.

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

Alongside the per-category results above, `matchResume` also returns
`hardRequirements: HardRequirement[]` (`src/lib/matching/hardRequirements.ts`,
spec §11/§29). A hard requirement is a pass/fail condition. A missing one
must never disappear inside the overall Job Match score, so it's reported
as its own list rather than folded into `skills`/`experience`. Each entry
has `id`, `type`, `requirementId` (when it came from a typed JD
requirement), `requirementText`, `satisfied`, typed `evidence`, and
`reason`.

`HardRequirementType` lists all seven spec types. Four are detected. Each
reuses a matcher's already-computed result, so a hard requirement always
agrees with the corresponding match:

| Type | Detected when | `satisfied` when |
| --- | --- | --- |
| `minimum-experience` | The JD states `experience.minimumYears`. | `matchExperience` returned `matched`. Evidence is the years figure (inferred-from-structure) plus the dated roles' meta lines. |
| `required-skill` | Once per `jobDescription.requiredSkills`. | That requirement's `MatchResult` is `matched`. A `partial` counts as unsatisfied, because a hard requirement is boolean, not graded. |
| `education` | Once per JD education line with `priority: 'required'`. A line that says "preferred" is not a hard gate. | `matchEducation` marked that line `matched`. "Or equivalent experience" plus real work experience is only `partial`, so it is reported as unsatisfied, with a reason explaining that no matching degree is listed. |
| `location` | The JD states a location that isn't remote. | The resume's contact location is the same string or the same city ("Austin, TX" vs "Austin, Texas"). A different or missing location is unsatisfied, and the reason says a resume can't show willingness to relocate or commute. It doesn't imply the candidate is ineligible. |

Not detected (the types exist in the union, but no detector guesses at
them):

- **`certification`**: JD certification lines are typed now, but they are
  free text with no certification taxonomy to canonicalize against.
  Deciding "satisfied" by name similarity against the resume's
  certifications could report a credential as held when it isn't, which
  is worse than reporting nothing.
- **`license`, `work-authorization`**: the JD parser extracts neither, and
  resumes rarely state work authorization, so there's no signal on either
  side.

`hardRequirementRecommendations.ts` turns each unsatisfied entry into a
`hard-requirement-gap` recommendation with type-specific guidance. A
location gap explicitly isn't framed as a resume change.

The UI (`src/components/JDMatch.tsx`, "Hard Requirements") always shows
this list as its own ✓/✗ block with each entry's evidence, separate from
the score breakdown.

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
  covers both "normalized" and "synonym" matching at once. Both sides are
  normalized once, at construction: the JD parser sets each requirement's
  `canonicalTerm`, and the resume builder sets each skill's
  `canonicalName`. The fuzzy layer
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
  candidate without a degree. That credit is recorded as
  `inferred-from-structure` evidence ("1 work experience entry listed; no
  degree listed."). It is not a quote, because no single line of the
  resume says "equivalent experience".
- **Semantic matching** (`semanticMatcher.ts`) exists only as the
  `SemanticMatcher` interface plus a `NoopSemanticMatcher` default — per
  the "AI ABSTRACTION" architecture principle, it's not called by
  `matchResume` in V1. A real implementation could be added later without
  changing any of the deterministic matchers above.

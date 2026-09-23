# Job Description Schema

Defined in `src/types/jobDescription.ts`, following
`docs/product/ats-engine-spec.md` §8-9. The matching engine compares a
`Resume` against a `JobDescription`. The Resume Health engine never needs
one.

## `JobRequirement`

Every requirement-like field is a list of typed requirements, not plain
strings:

```ts
interface JobRequirement {
  id: string              // req-required-0, req-preferred-1, tech-0, soft-2, edu-0, cert-0
  rawText: string         // exactly as the JD says it ("React.js")
  canonicalTerm: string   // normalized ("react"); matching compares on this
  category: 'skill' | 'technology' | 'keyword' | 'domain' | 'soft-skill' | 'education' | 'certification'
  priority: 'required' | 'preferred' | 'optional'
  minimumYears?: number   // only when the same JD line states a years figure for this term
  evidence?: string       // the verbatim JD line it came from, when that differs from rawText
  confidence: number
}

type Keyword = Omit<JobRequirement, 'category'> & { category: 'keyword' | 'domain' }
```

- **`canonicalTerm`**: skill, technology, and keyword terms go through the
  skill dictionary (`normalizeSkillName`). Soft skills use their taxonomy
  canonical name. Education, certification, and domain terms use plain
  keyword normalization (trim, lowercase).
- **`priority`**:
  - Items stated in the requirements section are `required`, and items in
    the preferred section are `preferred`.
  - Technologies only *mentioned* in responsibilities or overview prose
    are `optional`. They are signal, never a gate.
  - A soft skill takes the priority of the section it appears in.
  - An education or certification line is `preferred` when the line itself
    says "preferred", "nice to have", "a plus", or "bonus". Otherwise it is
    `required`.
- **`confidence`**: `1` for an item stated in a comma/pipe list or on its
  own line. `0.8` for a term mined from prose through the taxonomy: a real
  whole-word mention, but whether it is a firm requirement depends on
  context. These are fixed constants (`src/lib/schema/jdBuilders.ts`), so
  output stays deterministic.
- **`minimumYears`** is attached only from the same line. "5+ years of
  experience with React" sets `minimumYears: 5` on the React requirement.
  A line that doesn't name the term never contributes a figure.
- **`evidence`** is the JD line, stored as a string. Resume-side
  `Evidence.section` describes resume sections, so it doesn't apply to JD
  text. `rawText` holds the literal term, and `evidence` holds the line it
  was found on.
- **`category`** adds `education` and `certification` to the spec's five
  values. This lets JD education and certification lines share the typed
  shape and have an `id` that a `HardRequirement` can point back to.

## `JobDescription`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | `jd-<FNV-1a hash of the JD text>`. Content-derived and deterministic. |
| `title` | `string \| null` | |
| `seniority` | `string \| null` | From the title's seniority prefix, or a standalone seniority word elsewhere in the text. |
| `experience` | `{ minimumYears, maximumYears }` | Each `number \| null`. See below. |
| `requiredSkills` | `JobRequirement[]` | `category: 'skill'`, `priority: 'required'`. List items first, then terms mined from prose in the requirements section. Deduplicated by canonical term. |
| `preferredSkills` | `JobRequirement[]` | The same, from the preferred section. |
| `responsibilities` | `string[]` | One entry per responsibility line. See below. |
| `education` | `JobRequirement[]` | `category: 'education'`. One per line, kept whole. |
| `certifications` | `JobRequirement[]` | `category: 'certification'`. One per line. |
| `location` | `string \| null` | |
| `employmentType` | `EmploymentType \| null` | |
| `keywords` | `Keyword[]` | The distinct union of required and preferred skills, by canonical term (`kw-<n>`). |
| `technologies` | `JobRequirement[]` | `category: 'technology'`, `priority: 'optional'`. Mentioned in prose but not stated as a skill requirement. |
| `softSkills` | `JobRequirement[]` | `category: 'soft-skill'`. |
| `domainTerms` | `Keyword[]` | `category: 'domain'`, `priority: 'optional'`. Repeated all-caps jargon (HIPAA, SOC2, …). |
| `parserWarnings` | `string[]` | The same list `parseJobDescriptionText` also returns. |
| `rawText` | `string` | The full extracted text. |

### Deduplication and keywords

The parser records each canonical term at most once across required and
preferred skills. A requirements line that says "React.js" and a prose
line that says "React" produce one requirement, not two. `keywords` is
then the canonical-term union of both lists. A skill listed as both
required and preferred, or under two spellings, counts once, so the
keyword component never rewards repetition (spec §27).

### Why `responsibilities` is still `string[]`

A responsibility is a full sentence. It is compared against resume
bullets by token overlap (`responsibilityMatcher.ts`), not canonicalized
the way a term is, so a `canonicalTerm` field would have nothing
meaningful to hold. The matcher's result (`ResponsibilityMatchEntry`)
carries typed resume evidence.

### Why `hardRequirements` isn't on `JobDescription`

The spec lists `hardRequirements` on the JD. Here they live on
`MatchAnalysis`, because a `HardRequirement` includes `satisfied`,
`evidence`, and `reason`, and those only exist once the JD is compared
against a resume. The JD-side facts they're derived from are already
typed on the JD: `experience.minimumYears`, `requiredSkills`, `education`
lines with `priority: 'required'`, and `location`. See
`docs/scoring/matching-rules.md`.

### Why `experience` is a range with nullable bounds

A posting might say "5+ years" (minimum only), "2-4 years" (both bounds),
or give no experience requirement at all (both `null`). One object with
two nullable fields covers all three cases without a sentinel value.

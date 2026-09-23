# Resume Schema

Defined in `src/types/resume.ts` (with `Evidence` in `src/types/evidence.ts`),
following the canonical schema in `docs/product/ats-engine-spec.md` §3-10.
This is the structured representation every downstream engine
(normalization, Resume Health, matching, recommendations, versioning,
export) reads and writes — nothing downstream re-derives resume structure
from raw text again.

Every entity is built through one construction layer,
`src/lib/schema/resumeBuilders.ts`. The parser, the editor's edit functions
(`src/lib/resume-generation/applyEdits.ts`), and test fixtures all use it,
so a bullet parsed from a PDF and the same bullet typed into the editor
always get exactly the same ids and derived fields.

## Determinism

Identical input text must produce a `toEqual` `Resume` (spec §4). So:

- **No random ids.** `Resume.id` is `resume-<FNV-1a hash of the extracted
  text>` (`src/lib/schema/ids.ts`). Entity ids are positional within one
  Resume snapshot: `skill-0`, `exp-2`, `exp-2-bullet-1`, `edu-0`,
  `cert-0`, `proj-0`, `lang-0`, `award-0`, `section-3`.
- **No timestamps.** `metadata` holds only values derived from the input
  (source format, character count, line count).
- Skill ids are re-assigned positionally when the editor changes the
  skills list (`reindexSkills`), so they stay unique. Bullet and entry ids
  don't change when their text is edited.

`src/api/determinism.test.ts` runs the whole pipeline from raw text twice
and asserts `toEqual`, including every id, evidence item, score component,
and recommendation.

## `Evidence`

```ts
interface Evidence {
  text: string
  section: 'contact' | 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications' | 'other'
  entryId?: string            // the entry/skill the text came from, when there is one
  sourceType: 'explicit' | 'inferred-from-structure'
  confidence: number          // 0-1
}
```

Every claim about the candidate points back to one of these (spec §1:
"Evidence First"). `explicit` means `text` is a verbatim quote: a bullet,
a skills-list line, a header line. That covers nearly all evidence.
`inferred-from-structure` is only for facts with no single literal quote,
such as "3 experience entries detected." (Resume Structure) or "1 work
experience entry listed; no degree listed." (education matched on
"equivalent experience"). Here `text` describes the observation and the
UI labels it "(inferred)", so it is never shown as if the resume said it.
Languages and awards use `section: 'other'` because the spec's section
union has no dedicated value for them.

Helpers: `explicitEvidence`, `structuralEvidence`, and `dedupeEvidence` in
`src/lib/schema/evidence.ts`.

## `Resume`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | `resume-<hash>`. Content-derived. |
| `metadata` | `ResumeMetadata` | `{ sourceFormat: 'pdf' \| 'docx' \| 'text', characterCount, lineCount }`. `text` means parsed from raw text, not an uploaded file. |
| `contact` | `ContactInformation` | Called `candidate` before this rewrite. See below. |
| `summary` | `string \| null` | |
| `skills` | `ResumeSkill[]` | |
| `experience` | `ExperienceEntry[]` | Most-recent-first by convention. |
| `education` | `EducationEntry[]` | |
| `certifications` | `CertificationEntry[]` | |
| `projects` | `ProjectEntry[]` | |
| `languages` | `LanguageEntry[]` | Spoken languages from a "Languages" section. |
| `awards` | `AwardEntry[]` | From an "Awards"/"Honors" section. |
| `sections` | `ResumeSection[]` | The sections found, in document order. |
| `parserWarnings` | `string[]` | The same list `parseResumeText` also returns. |
| `parserMetadata` | `ParserMetadata` | `{ parser: 'talentlens-rule-based', parserVersion, taxonomyVersion }` |

`metadata` describes the source document. `parserMetadata` describes the
rules that produced this Resume: `parserVersion` is `RESUME_PARSER_VERSION`
and `taxonomyVersion` is `SKILL_TAXONOMY_VERSION` from
`src/lib/normalization/skillSynonyms.ts`. Together they let a stored
Resume be traced back to the parser and taxonomy that built it (spec §12:
"versioned taxonomy").

## `ContactInformation`

`name`, `email`, `phone`, and `location` are all `string | null`. The
parser may not be able to extract a field confidently, and guessing would
fabricate contact info. `links` is a typed list:
`{ type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'other', url }`.
`evidence` quotes the header line each found field came from.

Contact information is part of the Resume and has no `id` of its own.
The spec lists separate `linkedin`/`github`/`portfolio` fields; here those
are the typed `links` entries instead, which cover the same information
and also allow more than one link of a type.

## `ResumeSkill`

```ts
{
  id: string            // skill-<n>
  rawName: string       // exactly as written, never discarded ("React.js")
  canonicalName: string // normalizeSkillName(rawName) ("react")
  category: SkillCategory
  aliases: string[]     // the taxonomy's other spellings of canonicalName, excluding rawName
  evidence: Evidence[]
  confidence: number    // 1: only literally-listed skills enter Resume.skills
  sources: ('skills-section' | 'experience' | 'projects')[]
}
```

A skill enters `Resume.skills` only by being listed in the resume. Skills
are never added because a bullet mentions them, because that would put
words in the candidate's mouth. `evidence` always includes the
skills-list line the skill came from. `linkSkillEvidence` then adds every
experience or project bullet that also mentions the skill and sets
`sources` to match. The parser runs this after building the Resume, and
the editor runs it again after every edit, so skill evidence never points
at a bullet that has since been rewritten. The spec treats a skill that
appears in both the skills list and a bullet as stronger evidence than a
listed-only skill (§33), and `sources` records exactly that.

`category` is `language | framework | library | database | platform |
tool | methodology | soft-skill | other`, taken from the skills-list line's
label ("Languages:" → `language`). Skills added in the editor are
`other`.

## `ExperienceEntry`

| Field | Notes |
| --- | --- |
| `id` | `exp-<n>` |
| `company`, `title` | `title` is the spec's `jobTitle`. It kept its old name because it isn't ambiguous in this codebase. |
| `normalizedJobTitle` | `normalizeTitle(title).coreTitle`: seniority stripped, title synonyms collapsed. |
| `startDate`, `endDate` | `ISODateString \| null` |
| `isCurrent` | `true` only when the date text literally says Present/Current/Now. A missing end date alone is never treated as "current". |
| `location` | |
| `bullets` | `ExperienceBullet[]`. See below. |
| `technologies` | Canonical names of every technology its bullets mention, deduplicated, in first-mention order. |
| `experienceType` | `full-time \| part-time \| contract \| internship \| freelance \| volunteer \| unspecified`, read only from the entry's own title/meta text (e.g. "Intern"). Never assumed to be full-time. |
| `evidence` | The entry's meta line(s) (title/company/dates), quoted. |
| `warnings` | Parser warnings specific to this entry. These are also included in `Resume.parserWarnings`. |

The experience-years calculation still treats a `null` `endDate` as
running to today, so an undated end is not penalized. `isCurrent` exists
so the UI and future logic can tell "ongoing" apart from "not stated".

## `ExperienceBullet`

```ts
{
  id: string                 // <entryId>-bullet-<n>
  text: string               // verbatim
  actionVerb?: string        // lowercased opener, only when it's on ACTION_VERBS
  metrics: MetricEvidence[]  // { text: '35%', value: 35, kind: 'percentage' | 'currency' | 'multiplier' | 'duration' | 'count' }
  technologies: ResumeSkill[] // taxonomy skills named in the bullet; rawName = the spelling used
  responsibilities: string[] // the bullet as a duty ("Responsible for" lead-in stripped), when it isn't an achievement
  achievements: string[]     // [text] when it states a metric or opens with an outcome verb
  evidence: Evidence[]
}
```

`buildExperienceBullet` derives every field from `text` alone:

- `metrics` (`src/lib/schema/metrics.ts`) is purely extractive. Each
  number-bearing phrase is taken verbatim. A bare year is ignored, since
  "since 2019" is a date, not a metric. Nothing is scaled or estimated.
- `technologies` uses the same whole-word taxonomy search as the JD parser
  (`findTaxonomyMentions`). It also skips common-English variants
  ("rest", "next", "node", …) so that "the rest of the team" never becomes
  REST API experience.
- Every bullet has exactly one of `achievements` or `responsibilities`.
  This classifies the bullet's own text and never adds anything to it.

Editing a bullet's text rebuilds the entity (same `id`) through the same
function. `text` is stored exactly as given, so the editor can hold a
trailing space while the user types; the analysis runs on the trimmed
text.

Resume Health's Content Quality check and the bullet-impact recommendations
still run the long-standing text checks (`startsWithActionVerb`,
`isQuantified`), so those scores didn't move with this rewrite. The derived
fields add structure for display and future scoring. They don't replace
those checks.

## `EducationEntry`, `CertificationEntry`, `ProjectEntry`

Each has an `id` (`edu-<n>`, `cert-<n>`, `proj-<n>`) and `evidence`
quoting its source line(s). `degree` and `fieldOfStudy` are separate
fields so education matching doesn't have to re-parse a combined string.

`ProjectEntry.bullets` is still `string[]`. The spec only defines
`ExperienceBullet` for experience. Project bullets feed skill-evidence
linking and responsibility matching as plain text, and nothing yet needs
per-bullet structure there. Promoting them would be a separate change.

## `LanguageEntry`, `AwardEntry`

- **Languages** — `{ id, name, proficiency, evidence }`. The "Languages"
  section header is ambiguous, because many resumes use it for
  *programming* languages. If any item in the section is in the skill
  taxonomy (JavaScript, Python, …), the whole section is sent to the
  skills parser instead. Otherwise each comma-separated item becomes an
  entry. Proficiency is read from `English (Native)`,
  `Spanish - Fluent`, or `French: B2`, and is `null` when the resume
  doesn't state one.
- **Awards** — `{ id, title, issuer, date, evidence }`, one per line, the
  same convention as certifications. The date is read with the shared
  date parser. The text before the first separator is the title and the
  text after it is the issuer.

## `ResumeSection`

`{ id, type, heading, order, lineCount }`. `type` is one of `contact`
(the implicit header block at the top, with `heading: null`), `summary`,
`skills`, `experience`, `education`, `certifications`, `projects`,
`languages`, or `awards`. `heading` is the header line exactly as
written. Only recognized headers appear here. Content under an
unrecognized header stays in whichever section was active before it (see
`docs/architecture/resume-parser.md`).

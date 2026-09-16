# Resume Schema

Defined in `src/types/resume.ts`. This is the canonical structured
representation every downstream engine (normalization, ATS analysis,
matching, recommendations, versioning, export) reads and writes — nothing
downstream re-derives resume structure from raw text again.

## `Resume`

| Field | Type | Notes |
| --- | --- | --- |
| `candidate` | `Candidate` | Contact info; see below |
| `summary` | `string \| null` | Professional summary/objective, if present |
| `skills` | `Skill[]` | Extracted skills with evidence |
| `experience` | `ExperienceEntry[]` | Employment history, most-recent-first by convention |
| `education` | `EducationEntry[]` | |
| `certifications` | `Certification[]` | |
| `projects` | `Project[]` | |

## `Candidate`

`name`, `email`, `phone`, and `location` are all `string | null` — not
required. A parser may not be able to confidently extract any of these from
a given document (see the "Empty resume" / "No text extracted" error states
in `AGENTS.md`), and guessing at contact info would mean fabricating data
the candidate never provided. `links` is a typed list
(`{ type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'other', url }`)
rather than a bag of strings, so the UI can render appropriate icons/labels
without re-parsing URLs.

## `Skill`

```ts
{ name: string; category: SkillCategory; evidence: string[] }
```

`evidence` is the literal resume text (a bullet, a summary line, a
skills-list entry) that the skill was extracted from. This is what makes
"matched skills" claims verifiable rather than asserted: every skill the
engine reports can be traced back to something the candidate wrote, never
inferred or invented. `category` is one of `language | framework | library
| database | platform | tool | methodology | soft-skill | other` — coarse
enough to be assignable deterministically by the normalization/skill
dictionary (TASK-007), not a free-form field prone to inconsistency.

## `ExperienceEntry`

`startDate`/`endDate` are `ISODateString | null`. A `null` `endDate` means
the role is ongoing ("Present") — modeled as absence-of-value rather than a
sentinel string like `"Present"`, so every consumer (experience-years
calculation, formatting) handles it the same explicit way instead of
string-matching for magic values.

## `EducationEntry`, `Certification`, `Project`

Straightforward structured records. `degree` and `fieldOfStudy` are
separate fields (rather than one free-text string) so title/field matching
against a JD's `education` requirements (TASK-009) doesn't have to
re-parse a combined string.

## Deliberately not modeled yet

- **Resume versioning** (`ResumeVersion`, parent/child links, score
  snapshots) is a separate concern from the schema of a single resume and
  is added in TASK-017.
- **Parser metadata** (source format, raw text, extraction warnings) is not
  part of `Resume` itself — it belongs to whatever the parser returns
  alongside a `Resume` (TASK-004), keeping the domain schema free of
  pipeline concerns.

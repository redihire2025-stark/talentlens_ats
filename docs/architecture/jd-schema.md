# Job Description Schema

Defined in `src/types/jobDescription.ts`. The matching engine (TASK-009)
compares a `Resume` against a `JobDescription`; the ATS engine never
requires one.

## `JobDescription`

| Field | Type | Notes |
| --- | --- | --- |
| `title` | `string \| null` | Job title as posted |
| `seniority` | `string \| null` | e.g. `"senior"`, `"staff"` — from the title's recognized seniority prefix, or a standalone seniority word elsewhere in the text |
| `experience` | `ExperienceRequirement` | `{ minimumYears, maximumYears }`, each `number \| null` |
| `requiredSkills` | `string[]` | As extracted/normalized from the posting — from list lines *and* mined from prose (PRD §9; see `docs/architecture/jd-parser.md`) |
| `preferredSkills` | `string[]` | "Nice to have" skills, same list + prose extraction |
| `responsibilities` | `string[]` | One entry per responsibility/duty line |
| `education` | `string[]` | Free-text requirement lines (e.g. "Bachelor's in CS or equivalent") |
| `certifications` | `string[]` | Free-text requirement lines |
| `location` | `string \| null` | |
| `employmentType` | `EmploymentType \| null` | `full-time \| part-time \| contract \| internship \| temporary \| other` |
| `keywords` | `string[]` | Deduplicated union of `requiredSkills`/`preferredSkills`, used for ATS-style keyword matching |
| `technologies` | `string[]` | Technologies mentioned in prose (responsibilities, overview) that weren't stated as a required/preferred skill — signal, not a requirement |
| `softSkills` | `string[]` | Soft skills mentioned anywhere in the posting (communication, leadership, …) |
| `domainTerms` | `string[]` | Repeated all-caps acronyms/jargon (HIPAA, SOC2, GDPR, …) not already captured as a skill |
| `rawText` | `string` | The full extracted JD text, kept for AI-assisted semantic matching/explanation and re-parsing without re-uploading |

## Why skills/education/certifications are plain strings here, unlike `Resume`

`Resume.skills` is a richer `{ name, category, evidence }` shape because
each skill claim needs to be traceable to something the candidate wrote
(see `docs/architecture/resume-schema.md`). A job description doesn't have
that "evidence" concept — it simply states what's required. Modeling
`requiredSkills`/`preferredSkills`/`education`/`certifications` as
`string[]` matches the product spec's schema directly and avoids adding
structure the matching engine doesn't need. Normalization (`React.js` →
`react`) happens in the matching engine (TASK-007/TASK-009) when comparing
against `Resume.skills`, not by restructuring the JD at parse time.

## Why `experience` is a range with nullable bounds

A posting might say "5+ years" (minimum only), "2-4 years" (both bounds),
or omit experience requirements entirely (both `null`). Modeling this as
one object with two nullable fields, rather than a single number or a
required range, lets the experience matcher (TASK-009) represent all three
cases without a sentinel value.

# TalentLens — ATS Intelligence Engine Development Specification

> Source: user-provided "TalentLens — ATS Intelligence Engine, Development
> Specification & Implementation Prompt". See
> `docs/product/target-architecture-prd.md` for the prior target-architecture
> PRD this builds on, and `docs/architecture/target-architecture-gap.md` for
> what's deferred and why. This document is kept verbatim as the reference;
> gap analysis against the current implementation lives in
> `docs/architecture/ats-engine-spec-gap.md`.

You are implementing the core ATS/resume intelligence engine for TalentLens.
The objective is NOT to create a generic AI resume reviewer. The objective is
to build a deterministic, explainable, evidence-based ATS-style Resume
Analysis and Job Matching system.

The system must parse resumes into a canonical structured schema, normalize
extracted information, analyze resume quality, optionally parse a Job
Description, perform evidence-based matching, calculate a deterministic
score, and generate actionable recommendations. AI may be used only as an
optional enhancement layer for rewriting existing user content.

## 1. Non-negotiable product principles

1. **Evidence First** — never claim a candidate has a skill, experience,
   qualification, achievement, technology, certification, or responsibility
   unless there is evidence in the resume.
2. **Never invent candidate information** — technologies, skills, employers,
   titles, responsibilities, metrics, percentages, achievements,
   certifications, education, years of experience.
3. **Parsing, matching, scoring, and AI must be separate** — never
   `Resume + JD → LLM → Score`. AI must never determine the final score.
4. **Determinism** — identical Resume JSON + JD JSON + scoring config +
   taxonomy version must produce the same result every time. No randomness,
   network dependence, LLM dependence, wall-clock dependence, or
   non-deterministic ordering in scoring.
5. **Explainability** — every score is decomposable into components; every
   match carries requirement/status/matchType/confidence/evidence/reason.
6. **Resume Health and Job Match are different scores** — never merge them.
   `Resume Health = 92, Job Match = 61` is a valid, expected result.

## 2. System architecture (target module boundaries)

```
src/types/{resume,jobDescription,matching,scoring,recommendations,api}.ts
src/lib/parsers/{pdfParser,docxParser,sectionParser,experienceParser,educationParser,skillParser,jdParser}.ts
src/lib/normalization/{skillNormalizer,titleNormalizer,keywordNormalizer,taxonomy,synonyms}.ts
src/lib/ats/{analyzers/*, resumeHealthEngine, scoringConfig}.ts
src/lib/matching/{exactMatcher,normalizedMatcher,synonymMatcher,fuzzyMatcher,semanticMatcher,requirementMatcher,jobMatchEngine}.ts
src/lib/scoring/{scoreCalculator,scoreNormalizer,hardRequirementRules}.ts
src/lib/recommendations/{structureRecommendations,skillRecommendations,experienceRecommendations,jobMatchRecommendations,recommendationEngine}.ts
src/lib/ai/rewriteBullet.ts
src/lib/resume-generation/
src/api/, src/stores/, src/features/, src/components/
```

## 3-11. Canonical schemas (conceptual — see full spec for field-by-field detail)

- **Resume**: `id`, `metadata`, `contact`, `summary`, `skills`, `experience`,
  `education`, `certifications`, `projects`, `languages`, `awards`,
  `sections`, `parserWarnings`, `parserMetadata`.
- **ContactInformation**: name/email/phone/location/linkedin/github/portfolio
  + `evidence: Evidence[]`.
- **ResumeSkill**: `id`, `rawName` (never discarded), `canonicalName`,
  `category`, `aliases`, `evidence`, `confidence`, `sources`.
- **Evidence**: `text`, `section`, `entryId?`, `sourceType`
  (`explicit` | `inferred-from-structure`), `confidence`.
- **ExperienceEntry**: `id`, `jobTitle`, `normalizedJobTitle`, `company`,
  dates, `isCurrent`, `location`, `bullets`, `technologies`,
  `experienceType`, `evidence`, `warnings`.
- **ExperienceBullet**: `id`, `text`, `actionVerb`, `metrics`,
  `technologies`, `responsibilities`, `achievements`, `evidence`.
- **JobDescription**: `id`, `title`, `seniority`, `experience`,
  `requiredSkills`, `preferredSkills`, `responsibilities`, `education`,
  `certifications`, `location`, `employmentType`, `keywords`,
  `technologies`, `softSkills`, `domainTerms`, `hardRequirements`,
  `parserWarnings`. JD parser must mine requirements from prose, not just
  explicit lists.
- **JobRequirement**: `id`, `rawText`, `canonicalTerm`, `category`,
  `priority` (`required`/`preferred`/`optional`), `minimumYears?`,
  `evidence?`, `confidence`.
- **HardRequirement**: `id`, `type` (`minimum-experience` |
  `certification` | `license` | `education` | `work-authorization` |
  `location` | `required-skill`), `requirementText`, `satisfied`,
  `evidence`, `reason`. A missing hard requirement must never disappear
  inside an overall score — it's reported independently.

## 12. Normalization engine

Normalize before matching (`React.js`/`ReactJS` → `React`; `JS`/`Javascript`
→ `JavaScript`; `Postgres` → `PostgreSQL`). Maintain a versioned taxonomy.
**Related skills are never equivalent**: `React ≠ Angular`,
`Docker ≠ Kubernetes`, `AWS ≠ Azure`. Related does not mean possessed.

## 13-19. Matching engine

Order: exact → normalized → synonym → conservative fuzzy → optional
semantic, stopping at the first confident match. Semantic matching cannot
invent skills, infer adjacent skills as equivalent, override explicit
missing evidence, or independently determine score — and the rest of the
engine must work correctly with it disabled. Every result is a
`MatchResult`: `requirementId`, `requirement`, `normalizedTerm`, `status`,
`matchType`, `confidence`, `evidence`, `reason`.

## 20-27. Job Match scoring model

| Component | Weight |
| --- | --- |
| Required skills | 25% |
| Preferred skills | 10% |
| Experience | 15% |
| Responsibilities | 15% |
| Title / Seniority | 10% |
| Education | 5% |
| Keywords / Domain | 10% |
| Resume Health (quality factor only, never dominant) | 10% |

Each: `matched=100 / partial=50 / missing=0`, averaged, then weighted. An
absent JD requirement scores 100 for that category — never a candidate
penalty. Experience above the JD's stated requirement doesn't create
unlimited advantage (bounded proportional scoring). Responsibility scoring
requires contextual evidence, not generic word overlap. Keyword scoring
never rewards repetition/stuffing.

## 28-29. Absent-requirement rule & hard requirement reporting

Never treat an unstated JD requirement as a candidate gap. Hard
requirements are displayed independently from the score — a mandatory
failure (e.g. a required certification) must never be hidden inside an
aggregate number.

## 30-37. Resume Health engine (7 categories)

| Category | Weight |
| --- | --- |
| ATS Essentials | 20% |
| Resume Structure | 20% |
| Content Quality | 15% |
| Skills & Evidence | 20% |
| Experience & Seniority | 10% |
| Recruiter Readability | 10% |
| Risk & Consistency | 5% |

Each analyzer returns `{ score, strengths, issues, explanation }`. Don't
require metrics in every bullet. A skill demonstrated in experience/projects
counts as stronger evidence than one only listed. Don't penalize creative
formatting just for being unconventional. Flag risk/consistency issues for
review, not as accusations of dishonesty.

## 38-41. Recommendation engine

Categories: `missing-section`, `bullet-impact`, `skill-evidence`,
`skill-not-demonstrated`, `title-alignment`, `formatting`,
`hard-requirement-gap`, `experience-gap`, `responsibility-gap`,
`education-gap`, `certification-gap`.

`Recommendation`: `id`, `category`, `severity` (`critical`/`high`/`medium`/
`low`), `issue`, `evidence`, `explanation`, `suggestedChange`, `confidence`,
`source` (`deterministic`/`ai-suggestion`), `requiresUserInput`, `status`.

## 42-44. AI rewrite rule

AI runs only after a deterministic recommendation exists, receives the
original bullet + evidence, and must preserve every factual claim
(employers, technologies, dates, metrics, achievements) while improving
clarity/phrasing — never inventing metrics, technologies, responsibilities,
achievements, or adding JD skills the resume doesn't state. If AI output
violates this, reject it and keep the deterministic suggestion. **The score
is always calculated from the actual resume content, before and
independently of any AI rewrite** — a score changes because the resume
changed, never because "AI said it was better."

## 45-48. Editor, versioning, before/after

The editor uses the exact same analysis engine as initial analysis — no
separate editor scoring logic. Never mutate the original; every accepted
change produces a new version. Before/after must show what changed, why the
score changed, which requirements improved, which gaps remain — a score
change without an explanation is not acceptable (e.g. "+5 Required Skill
Coverage, +2 Responsibility Alignment, -1 Risk/Consistency").

## 49. No guaranteed outcome

Never claim a resume "will get you an interview" or that a score
"guarantees selection."

## 50-52. Testing requirements

Unit tests for every deterministic module, including edge cases (empty/short
resumes, missing sections, two-column/table-heavy/scanned/malformed
documents, overlapping jobs, varied date formats, skill-alias pairs,
missing JD fields, prose-embedded requirements) and a mandatory determinism
test: `analyzeResume(resume, jd)` called twice must produce `toEqual`
results.

## 53-55. Score & UI contracts

`JobMatchAnalysis`: `score`, `breakdown` (one `ScoreComponent` per
component: `rawScore`, `weight`, `weightedScore`, `explanation`,
`evidence`), `hardRequirements`, `matches`, `gaps`, `recommendations`,
`explanation`. UI never shows a bare percentage — always the full
breakdown, matched/partial/missing per requirement, and hard requirements
listed separately. Recommendations grouped by section (Resume Structure,
Experience, Skills, Job Title, Job Match, Formatting, Critical
Requirements); every card shows issue, evidence, why it matters, suggested
change, confidence, and Accept/Reject/Edit/AI-Rewrite — never applied
silently.

## 56-59. Processing, performance, security, privacy

Processing screen must reflect real processing state, not a fake animation.
Keep deterministic analysis client-side/local; don't introduce
Postgres/Kafka/Kubernetes/microservices for the scoring engine without an
actual product requirement — keep the API-shaped abstraction so backend
infra can be added later without rewriting the engine. If AI rewriting is
enabled, the key must live server-side only (browser → server function →
OpenAI), never in client JS. Session-only by default; don't add persistent
storage or send resume/JD content to AI unless the user has enabled AI
enhancement.

## 60. Implementation priority

Types → Resume Parser → Normalization → Resume Health → JD Parser →
Matching → Job Match Scoring → Hard Requirements → Recommendations → AI
Enhancement → Editor → Versioning → Export.

## 61. Do-not-do list

No `Resume+JD→LLM→score`; no LLM deciding skill existence or final score;
no inventing skills/metrics; no treating related technologies as
equivalent; no rewarding keyword stuffing; no penalizing unstated JD
requirements; no assuming one-page resumes; no treating every missing
section as equally important; no hiding mandatory requirement failures; no
mixing Resume Health and Job Match; no separate editor scoring logic; no
authoritative AI output; no random or network-dependent scoring.

## 62. Definition of done

See the source spec's full checklist — canonical parsing for PDF/DOCX,
normalized skills/titles with evidence, JD prose mining, required/preferred
separation, hard requirement detection, all matching layers (semantic
optional), deterministic Resume Health and Job Match, fully decomposable
scores, evidence on every match/recommendation, explainable missing
requirements, AI unable to alter facts or scores, explainable score
changes, immutable original resume, shared editor/analysis engine,
comparable versions, no randomness, full test coverage.

## Final architectural contract

```
ORIGINAL RESUME → EXTRACTION → RESUME PARSER → CANONICAL RESUME JSON
  → NORMALIZATION → { RESUME HEALTH | JD PARSER → JOB DESCRIPTION JSON
  → REQUIREMENT ENGINE } → MATCHING ENGINE (exact/rules/semantic)
  → SCORE ENGINE → { MATCH SCORE | HARD GAPS } → RECOMMENDATION ENGINE
  → DETERMINISTIC SUGGESTIONS → OPTIONAL AI → AI-DRAFTED REWRITE
  (unverified only) → USER (Accept/Reject/Edit) → NEW VERSION
  → SAME SCORING PIPELINE → BEFORE/AFTER EXPLANATION
```

The ATS engine determines facts from the resume, the JD parser determines
requirements from the job description, the matching engine compares
evidence, the scoring engine calculates the score, and AI only helps
rewrite user-approved content. Do not collapse these responsibilities into
one AI call.

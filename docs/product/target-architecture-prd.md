# TalentLens — Architecture & Implementation PRD (Target Architecture)

> Source: user-provided "TalentLens Architecture & Implementation PRD — Final
> Target Architecture" document. This is the target direction for the product.
> See `docs/product/v1-scope.md` and `docs/architecture/overview.md` for how
> much of this is implemented today versus deferred, and why.

**Purpose:** Implementation-ready architecture derived from the TalentLens
As-Built PRD, with the product structure corrected toward a production-grade
resume intelligence platform and unnecessary complexity removed.

**Primary implementation instruction:** Use this document as the target
architecture. Do not implement excluded features or infrastructure unless
explicitly requested later.

## Core product loop

Upload Resume → Parse → Canonical Resume JSON → Resume Health Analysis →
Optional Job Description → JD Parsing → Resume ↔ Job Matching → Evidence +
Recommendations → AI-assisted Tailoring → User Accept/Reject/Edit → New
Resume Version → Re-score → Export PDF/DOCX

## 1. Product Direction

TalentLens should evolve from the current anonymous, session-only prototype
into a modular resume intelligence platform. The current deterministic,
evidence-based core should be preserved. The major correction is to
introduce a real backend boundary, persistence, versioning, controlled AI
assistance, and a stronger JD intelligence layer.

The product should not claim to reproduce an employer's proprietary ATS
score. Use two transparent product metrics:

- **Resume Health / ATS Readiness** — resume-only analysis covering parsing,
  structure, formatting, content, evidence, consistency and recruiter
  readability.
- **Job Match Score** — resume-to-specific-JD compatibility based on
  required/preferred skills, experience, responsibilities, title, education,
  keywords and semantic relevance.

## 2. What to Remove

- No recruiter dashboard, candidate management or recruiter analytics in the
  core product.
- No microservices to start.
- No Kubernetes.
- No Kafka.
- No automatic job-application agent.
- No product design around unrestricted LinkedIn/Naukri scraping.
- No interview-outcome prediction or hiring-probability scoring.
- No LLM responsible for the core score.
- Never infer a missing skill from a related technology without evidence.
- Never silently modify a user's resume.

## 3. Architecture Principles

- Evidence first.
- Deterministic scoring for core analysis.
- AI for semantic assistance and writing, not authoritative scoring.
- Every recommendation must be explainable.
- Every accepted change must be versioned and reversible.
- Never fabricate experience, employers, technologies, dates, job titles,
  achievements or metrics.
- Separate parsing, normalization, analysis, matching, recommendation and
  generation.
- Start as a modular monolith; extract services only when there is a
  demonstrated operational need.
- Minimize stored resume data and keep privacy controls explicit.
- Keep score changes traceable to concrete edits.

## 4. Target System Architecture

```
TalentLens
├── Web App (React + TypeScript)
└── API (Node + TypeScript)
    ├── Domain Modules: Auth, Resume, JD, Analysis, Matching,
    │                    Recommendations, Versions, Export
    └── Infrastructure: PostgreSQL, Object Storage, Redis (when needed),
                         AI Provider

Resume Intelligence pipeline:
  Resume Parser / JD Parser / File Extraction
    → Resume JSON / JD JSON
    → Normalization Layer
    → ATS Engine / Match Engine / AI Engine
    → Resume Health / Job Match / Suggestions
    → Recommendation
    → Resume Editor
    → Version Manager (→ PostgreSQL) / Export (→ PDF/DOCX)
```

## 5. Frontend Architecture (target)

```
apps/web/
└── src/
    ├── app/
    ├── features/
    │   ├── resume/, job-description/, analysis/, matching/,
    │   │   recommendations/, editor/, versions/, export/
    ├── components/
    ├── stores/
    ├── api/
    ├── hooks/
    └── types/
```

Keep UI state separate from server state. Zustand may manage editor/UI
state; a server-state library such as React Query/TanStack Query may manage
API data and caching.

## 6. Backend Modular Monolith (target)

```
apps/api/
└── src/
    ├── modules/
    │   ├── auth/, resumes/, jobs/, parsing/, analysis/, matching/,
    │   │   recommendations/, ai/, versions/, export/
    ├── infrastructure/
    │   ├── database/, storage/, queue/, ai/
    └── shared/
```

## 7. Shared Domain Packages (target)

```
packages/
├── resume-core/
├── jd-core/
├── parser/
├── normalization/
├── ats-engine/
├── matching-engine/
├── recommendation-engine/
├── ai/
└── document-generation/
```

## 8. Resume Parsing Pipeline

PDF/DOCX → File validation → Text/layout extraction → Section detection →
Entity extraction → Normalization → Evidence attachment → Canonical Resume
JSON.

Keep extraction adapters separate from pure parsing logic — PDF/DOCX
library-specific extraction should not contaminate the deterministic
parser.

Canonical resume model should contain structured sections: contact,
summary, experience, education, skills, projects, certifications and links.
Skills must retain literal evidence from the source document.

## 9. Job Description Parsing

Text extraction → Section detection → Requirement extraction →
Normalization → Canonical JD JSON.

The JD parser must improve on the limitation where skills are primarily
captured from explicit lists — requirements mentioned in prose must also be
extracted.

```ts
interface JobDescription {
  title?: string;
  seniority?: string;
  location?: Location[];
  employmentType?: string;
  experience?: { minimumYears?: number; maximumYears?: number };
  requiredSkills: Requirement[];
  preferredSkills: Requirement[];
  responsibilities: Responsibility[];
  education?: Requirement[];
  keywords: Keyword[];
  technologies: Requirement[];
  softSkills: Requirement[];
  domainTerms: Keyword[];
  rawText: string;
}
```

## 10. Normalization Layer

Normalize equivalent terminology before matching (`React.js`/`ReactJS`/
`React JS` → `react`; `AWS`/`Amazon Web Services` → `aws`). Maintain
conservative synonym dictionaries and version them. Normalization makes
terms comparable; it does not create evidence.

## 11. Resume Health / ATS Readiness Engine

Organize checks into seven product categories:

| Category | Representative checks |
| --- | --- |
| ATS Essentials | File format/size, parseability, contact information, email, links, filename, header/footer risk, reading order |
| Resume Structure | Required sections, headings, order, experience/education/skills/project structure |
| Content Quality | Quantified impact, action verbs, bullet consistency, repetition, grammar, spelling, vague language |
| Skills & Evidence | Skill presence, literal evidence, confidence, unsupported claims |
| Experience & Seniority | Relevant experience, career progression, leadership evidence, responsibility-to-impact |
| Recruiter Readability | Clarity, relevance, information density, impact visibility, repeated information |
| Risk & Consistency | Date conflicts, overlapping employment, title/company consistency, link consistency |

## 12. Job Match Engine

Resume JSON + JD JSON → deterministic matching (exact → normalized →
synonym → conservative fuzzy) → optional semantic matching → evidence
validation → MATCHED / PARTIAL / MISSING.

Semantic matching is an enhancement, not a replacement for evidence.
Related skills must not automatically become matches (e.g. Kubernetes does
not prove Docker experience).

Every match result should contain requirement text, normalized term,
status, match type, confidence, resume evidence, and an explanation where
useful:

```json
{
  "requirement": "GraphQL",
  "status": "missing",
  "matchType": "none",
  "confidence": 1,
  "resumeEvidence": [],
  "reason": "No explicit GraphQL evidence was found."
}
```

## 13. Job Match Scoring

Use a transparent weighted model. Weights should be configurable rather
than hard-coded throughout the codebase.

| Component | Suggested weight |
| --- | --- |
| Required skills | 25% |
| Preferred skills | 10% |
| Experience | 15% |
| Responsibilities | 15% |
| Title / seniority | 10% |
| Education | 5% |
| Keywords / domain terms | 10% |
| Resume Health / ATS Readiness | 10% |

Important: if a requirement is not stated in the JD, do not penalize the
candidate for it. Missing requirements are not resume gaps.

## 14. AI Architecture

AI Layer → Writing Suggestions / Semantic Matching & Tailoring / Explanation
→ User approval → Resume version.

AI is allowed to improve wording, explain gaps, perform semantic
similarity, generate tailored suggestions and assist with
summaries/bullets. AI is **not** allowed to invent experience, technologies,
employers, dates, job titles, achievements or metrics.

All AI outputs should be structured and validated before reaching the
editor. Prefer structured JSON responses and explicit constraints.

## 15. Recommendation Model

```
Recommendation
├── id
├── category
├── severity
├── issue
├── evidence
├── explanation
├── suggestedChange
├── confidence
├── source
├── requiresUserInput
└── status (pending / accepted / rejected / edited)
```

A recommendation must answer: What is wrong? Why does it matter? What
evidence supports it? What can the user do? What exactly will change?

## 16. Resume Editor & Versioning

Original Resume → Suggestions → Accept/Reject/Edit → Resume Version 2 →
Re-run Resume Health + Job Match → Before/After comparison → Export.

Every accepted modification should create a traceable change set. Never
silently mutate the source resume.

## 17. Database Model (target)

```
users
resumes, resume_versions, resume_sections, resume_experiences,
resume_skills, resume_education, resume_projects, resume_links
job_descriptions, job_requirements, job_responsibilities
analyses, analysis_checks, match_results, recommendations
resume_edits, exports
saved_jobs        # Phase 6
applications      # Phase 6
```

PostgreSQL should hold structured application data. Uploaded PDF/DOCX files
should live in object storage, with the database storing metadata and
storage keys rather than large binary documents.

## 18. Storage (target)

- PostgreSQL → structured data
- Object Storage → PDF/DOCX (source resume, generated exports)

## 19. API Contracts (target)

```
POST /api/resumes
POST /api/resumes/:id/parse
GET  /api/resumes/:id
POST /api/resumes/:id/analyze

POST /api/jobs/parse
POST /api/matches
GET  /api/matches/:id

POST /api/recommendations
POST /api/suggestions/:id/accept
POST /api/suggestions/:id/reject

POST /api/resumes/:id/versions
POST /api/resumes/:id/tailor
POST /api/resumes/:id/export

GET  /api/health
```

## 20. Background Processing

Do not introduce a distributed event architecture. When parsing, AI
generation or document rendering becomes slow enough to require
asynchronous execution, use a simple queue such as Redis + BullMQ. Keep
queue adoption incremental.

## 21. Authentication & Persistence

Authentication and persistent storage belong in the production
architecture, but they should not block the first functional MVP. Build the
core resume/JD intelligence engines so they are independent of
authentication.

Target user data model: `User → Resumes, Resume Versions, Job Descriptions,
Analyses, Recommendations, Saved Jobs (later), Applications (later)`.

## 22. UI Information Architecture

Landing → Upload Resume → Resume Health Dashboard (Score, Checks, Evidence,
Recommendations) → Add Job Description → Job Match Dashboard (Match Score,
Matched, Partial, Missing, Evidence) → Tailor Resume → AI Suggestions
(Accept/Reject/Edit) → Version Comparison → Export.

## 23. Product Phases

**Phase 1 — Core Resume Intelligence**: resume upload, PDF/DOCX extraction,
canonical resume JSON, normalization, Resume Health engine, evidence model,
analysis dashboard.

**Phase 2 — JD Matching**: JD paste/upload, JD parser, requirement
extraction from prose and lists, exact/normalized/synonym/fuzzy matching,
optional semantic matching, Job Match score, evidence-based results.

**Phase 3 — AI Assistance**: recommendations, bullet improvement, grammar,
action verbs, summary assistance, missing-keyword explanations, tailoring,
accept/reject/edit workflow.

**Phase 4 — Editor & Export**: structured resume editor, versioning,
before/after comparison, PDF export, DOCX export.

**Phase 5 — Accounts & Persistence**: authentication, user profile, saved
resumes, resume versions, saved JDs, analysis history.

**Phase 6 — Job Intelligence**: authorized job sources, job ingestion,
normalization, deduplication, job search, resume-to-job matching, saved
jobs, application tracking.

## 24. Explicit Do-Not-Build List

Recruiter dashboard, candidate management, candidate ranking for
recruiters, Kubernetes, Kafka, microservices, service mesh, automatic job
applications, unrestricted LinkedIn/Naukri scraping, interview outcome
prediction, hiring probability prediction, claims that TalentLens reproduces
an employer's ATS score, silent AI modifications, fabricated resume facts.

## 25. Acceptance Criteria for the Core System

- The same deterministic resume input produces the same Resume Health
  result.
- Every score has a visible breakdown.
- Every skill match can be traced to resume evidence.
- Missing requirements are not fabricated into matches.
- JD requirements can be extracted from both lists and prose.
- AI suggestions are structured, constrained and user-controlled.
- Accepted changes create a new resume version.
- Before/after analysis can identify which edits changed which checks.
- PDF/DOCX exports preserve the approved resume content.
- Core scoring does not fail when the AI provider is unavailable.
- The system can run deterministically without an LLM.
- AI is an enhancement layer, not a critical scoring dependency.

## 26. Final Implementation Rule

Implement incrementally. Do not rewrite the entire existing application
blindly. First inspect the current repository and map existing modules to
the target architecture. Preserve working deterministic parsing,
normalization, ATS analysis, matching and evidence behavior where it
satisfies this PRD. Refactor only where the new architecture requires it.

Implementation order:

1. Repository audit and architecture mapping
2. Define shared domain types
3. Stabilize parser + canonical Resume JSON
4. Stabilize JD JSON and prose requirement extraction
5. Extract Resume Health engine
6. Extract Matching engine
7. Add evidence model everywhere
8. Add API/backend boundary
9. Add PostgreSQL persistence
10. Add object storage
11. Add AI provider interface
12. Add recommendation workflow
13. Add versioning
14. Add editor + re-scoring
15. Add PDF/DOCX export
16. Add authentication
17. Add job intelligence only after the core loop is stable

## 27. Product Positioning

TalentLens should be positioned as a transparent resume intelligence and
job-matching product — not as a system that knows the exact score an
employer's ATS will assign. Its strongest differentiators should be
evidence, explainability, deterministic core scoring, controlled AI
assistance and version-aware re-analysis.

# V1 Scope

> See `docs/product/target-architecture-prd.md` for the target direction
> and `docs/architecture/target-architecture-gap.md` for exactly what that
> PRD asks for that this sandbox cannot build (real Postgres, object
> storage, a deployed backend process, auth, a hosted AI provider, a
> background queue) and why.

## Product

TalentLens — "Smarter Resume & Talent Matching." A resume intelligence and
job-matching platform for job seekers (primary, V1) and recruiters
(architecturally possible later, not built in V1).

## In scope for V1

- Anonymous use — no login, no accounts.
- Upload a resume (PDF/DOCX) → parse into structured Resume JSON.
- Deterministic Resume Health / ATS Readiness score with full breakdown,
  across 7 product categories (ATS Essentials, Resume Structure, Content
  Quality, Skills & Evidence, Experience & Seniority, Recruiter
  Readability, Risk & Consistency).
- Optional job description input → structured JD JSON (including
  requirements mined from prose, not just list lines) → Job Match Score.
- Matched / missing / partially-demonstrated skills, each with a match
  type, confidence, and a plain-language reason.
- Evidence-based, editable recommendations (accept / reject / edit),
  including AI-drafted bullet rewrites as a clearly-labeled, optional,
  non-authoritative suggestion source.
- Resume versioning (original + edited versions) held in memory.
- Recalculated scores after edits.
- Export optimized resume to PDF/DOCX.
- In-memory session state only — no persistent database.

## Explicitly out of scope for V1

- Authentication / user accounts.
- Persistent resume storage across sessions.
- Recruiter dashboard, candidate management, job tracking.
- Semantic/embedding-based matching as a requirement (may exist later as an
  optional, swappable enhancement behind `SemanticMatcher`).
- Local or hosted LLM as a dependency of the Resume Health or matching
  engines — the one existing AI feature (bullet rewrite suggestions) is
  optional and never authoritative for any score.
- Supabase, PostgreSQL, Redis, Kafka, Kubernetes, microservices.
- Everything on the target PRD's explicit do-not-build list (§24):
  candidate ranking for recruiters, service mesh, automatic job
  applications, unrestricted scraping, interview-outcome or
  hiring-probability prediction, and any claim that TalentLens reproduces
  an employer's proprietary ATS score.

## Product principles (drive every feature decision)

1. Transparency — scores always come with a breakdown, never a bare number.
2. Evidence-based analysis — nothing is "matched" or recommended without
   evidence in the source document.
3. User control — every recommendation can be accepted, rejected, or
   edited; nothing is applied silently.
4. Privacy — resume/JD content isn't persisted, logged, or exposed beyond
   what's needed to render the current session.
5. No fabricated resume content — the system never invents metrics,
   employers, technologies, or achievements.
6. No guaranteed-outcome claims — no promise that a change increases real
   interview or hiring odds.
7. Every score change is explainable — a before/after must be traceable to
   specific edits.

## Recruiter track (future, not V1)

The data model and UI information architecture are kept compatible with a
future recruiter experience (jobs, candidates, match insights, shortlists),
but no recruiter feature is implemented in V1 beyond a "Coming Soon" entry
point already present in the prototype (`UserTypeSelection.tsx`).

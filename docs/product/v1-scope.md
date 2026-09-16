# V1 Scope

## Product

TalentLens — "Smarter Resume & Talent Matching." A resume intelligence and
job-matching platform for job seekers (primary, V1) and recruiters
(architecturally possible later, not built in V1).

## In scope for V1

- Anonymous use — no login, no accounts.
- Upload a resume (PDF/DOCX) → parse into structured Resume JSON.
- Deterministic ATS Compatibility Score with full breakdown.
- Optional job description input → structured JD JSON → JD Match Score.
- Matched / missing / partially-demonstrated skills.
- Evidence-based, editable recommendations (accept / reject / edit).
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
- Local or hosted LLM as a dependency of the ATS or matching engines.
- Supabase, PostgreSQL, Redis, Kafka, Kubernetes, microservices.

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

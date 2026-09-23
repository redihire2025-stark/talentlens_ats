# Job Description Parser

`src/lib/parsers/jd/` turns pasted or uploaded job description text into a
`JobDescription` (see `docs/architecture/jd-schema.md`). It follows the
same extraction/parsing split as the resume parser
(`docs/architecture/resume-parser.md`), and shares the actual PDF/DOCX
extraction and file-validation code with it via
`src/lib/parsers/shared/` — both parsers accept the same document types,
so that logic isn't duplicated per domain.

## Text-only path is primary

Unlike a resume, a JD is most often pasted as plain text directly into the
UI ("Paste Job Description"), not uploaded as a file. `parseJobDescriptionText`
is the primary entry point; `parseJobDescriptionFile` (upload path) is a
thin wrapper that extracts text first and then calls it — same as
`parseResumeFile`.

## How text becomes a JobDescription

1. `sections.ts` splits the text into `header` / `requiredSkills` /
   `preferredSkills` / `responsibilities` / `education` / `certifications`
   buckets, matching lines against known header aliases ("Requirements",
   "Preferred Qualifications", "What You'll Do", etc.) — same technique as
   the resume parser's `splitResumeSections`, different alias set.
2. `fieldExtractors.ts` scans the **whole document** (not just one
   section) for structural signals that can appear anywhere: employment
   type keywords, an experience-years mention, a location, a title
   (preferring a labeled "Job Title:" line, falling back to a short first
   header line), a seniority level (`extractSeniority`), and repeated
   all-caps domain acronyms (`extractDomainTerms`).
3. `buildSkillList.ts` pulls flat skill names out of list-like lines
   (comma/pipe/semicolon separated, not ending in sentence punctuation) —
   e.g. "Required Skills: React, TypeScript". `extractProseSkills.ts`'s
   `mineTermsFromText` then separately mines skill mentions out of the
   *prose* lines in the same sections — see below.
4. `responsibilities`, `education`, and `certifications` are the section's
   lines as-is (bullet markers stripped) — full sentences, not split into
   fragments.
5. `keywords` is the deduplicated, lowercased union of `requiredSkills` and
   `preferredSkills` (which now already include prose-mined terms — see
   below). Folding `technologies`/`domainTerms`/`softSkills` into
   `keywords` as well is noted as a next step in
   `docs/scoring/scoring-methodology.md`.

## Requirement extraction from prose (target architecture PRD §9)

`extractProseSkills.ts`'s `mineTermsFromText` scans text for whole-word
mentions of any variant in a synonym dictionary (`SKILL_SYNONYM_GROUPS` for
skills/technologies, `SOFT_SKILL_GROUPS` for soft skills) and returns the
matched canonical terms — conservatively:

- Every variant is matched as a whole word/phrase, never a substring
  ("javascript" can't match inside "typescript").
- A variant of two characters or fewer ("go", "js", "ts") is never mined —
  the false-positive rate against ordinary English prose ("go through the
  backlog") is too high to mine reliably.
- A term already found elsewhere (e.g. already in a comma-separated skills
  line) is never duplicated.

Where a mined term lands depends on which section it came from: prose in
the requirements/preferred sections becomes `requiredSkills`/
`preferredSkills` (the JD is stating a requirement); prose anywhere else
(responsibilities, overview) becomes `technologies` instead — a *mention*,
not necessarily a stated requirement, so it doesn't inflate the weighted
skill-match score (see `docs/scoring/matching-rules.md`'s "don't penalize
for what the JD never asked for"). `extractDomainTerms` in
`fieldExtractors.ts` separately mines repeated all-caps acronyms (HIPAA,
SOC2, GDPR, …) into `domainTerms`, with a stoplist for generic ones (CEO,
HR, US, …) and a "mentioned at least twice" threshold to avoid catching a
stray one-off abbreviation.

## Known limitations

This is a deterministic, rule-based parser, not a resume-specific ML
model — it works well for conventionally-formatted resumes and degrades
gracefully (never crashes, never fabricates data) on unconventional ones:

- **Very short skill/tech names** (two characters or fewer, e.g. "Go",
  "Js", "R") are still only captured from an explicit list line, never
  mined from prose — see "Requirement extraction from prose" above for why.
- **Experience-years detection** scans the whole document for any "N
  years" mention, not just ones near the word "experience" — a JD that
  mentions an unrelated duration could be misread. This fails safe: the
  matching engine only ever reports a gap against whatever number this
  produces, never fabricates resume evidence to fill it.
- **Education/certifications require an explicit section header.** A
  degree requirement mentioned only inline within a general requirements
  paragraph (no "Education" header) isn't captured.
- **Seniority detection** relies on a recognized prefix on the title, or a
  standalone seniority word elsewhere in the text — a JD that expresses
  level only implicitly (e.g. via years-of-experience or scope of
  responsibility, with no seniority word at all) leaves `seniority: null`
  rather than guessing.

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
   type keywords, an experience-years mention, a location, and a title
   (preferring a labeled "Job Title:" line, falling back to a short first
   header line).
3. `buildSkillList.ts` only pulls flat skill names out of list-like lines
   (comma/pipe/semicolon separated, not ending in sentence punctuation) —
   e.g. "Required Skills: React, TypeScript". A prose requirement line
   ("3+ years building production React applications") is left as-is; it
   isn't mined for implicit skill mentions.
4. `responsibilities`, `education`, and `certifications` are the section's
   lines as-is (bullet markers stripped) — full sentences, not split into
   fragments.
5. `keywords` is currently just the deduplicated, lowercased union of
   `requiredSkills` and `preferredSkills`. Canonicalizing these (`React.js`
   → `react`) and mining keywords out of prose responsibilities/
   requirements is the normalization engine's job (TASK-007), not this
   parser's.

## Known limitations

- **Skills embedded only in prose** ("experience with React and Node.js
  required") aren't captured unless the JD also lists them in a
  comma-separated line. This is a deliberate, documented trade-off: mining
  arbitrary prose for skill mentions without a skill dictionary risks false
  positives, and TASK-007's normalization/skill-dictionary work is the
  right place to do that reliably.
- **Experience-years detection** scans the whole document for any "N
  years" mention, not just ones near the word "experience" — a JD that
  mentions an unrelated duration could be misread. This fails safe: the
  matching engine (TASK-009) only ever reports a gap against whatever
  number this produces, never fabricates resume evidence to fill it.
- **Education/certifications require an explicit section header.** A
  degree requirement mentioned only inline within a general requirements
  paragraph (no "Education" header) isn't captured in V1.

# Resume Parser

`src/lib/parsers/resume/` turns an uploaded PDF/DOCX into a `Resume` (see
`docs/architecture/resume-schema.md`). It's split into two halves on
purpose:

- **Extraction** (`extractText.ts`) — binary file → raw text, via
  [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) for PDF and
  [mammoth](https://www.npmjs.com/package/mammoth) for DOCX. Both run
  entirely in the browser (no server) — see "Why no separate backend app
  in V1" in `docs/architecture/overview.md`.
- **Parsing** (`parseResumeText.ts` and the `build*.ts` modules) — raw text
  → `Resume`. Pure, synchronous, and deterministic: no I/O, no randomness.

This split exists so the logic we actually own and need to get right — the
text-to-structure heuristics — can be unit tested with plain strings,
without needing real PDF/DOCX binary fixtures. The extraction half is a
thin adapter over two well-established libraries and isn't separately
unit tested; `extractText.smoke.test.ts` only checks that both libraries'
modules resolve correctly under the build (the pdf.js worker URL,
mammoth's browser build), which is the failure mode a pure type-check
wouldn't catch.

## How text becomes a Resume

1. `textSections.ts` splits the raw text into `header` / `summary` /
   `skills` / `experience` / `education` / `certifications` / `projects`
   buckets by matching lines against a known set of section-header aliases
   (e.g. "Work Experience", "Employment History"). Unrecognized headers
   simply aren't detected as headers — their content stays in whichever
   bucket is currently active rather than being dropped.
2. Each bucket is handed to a dedicated `build*.ts` module:
   - `buildCandidate.ts` — name/email/phone/location/links from the header
     block, plus a summary fallback when there's no explicit "Summary"
     section.
   - `buildSkills.ts` — splits skill lines by comma/pipe/bullet; a leading
     "Label:" (e.g. "Languages:") gives a default `SkillCategory`. Full
     canonicalization (`React.js` → `react`) is the normalization engine's
     job (TASK-007), not this parser's.
   - `buildExperience.ts` / `buildEducation.ts` / `buildProjects.ts` —
     split their section into blank-line-separated blocks (one per entry)
     and pull dates, location, and a title/company (or institution/degree)
     split out of the remaining text.
   - `buildCertifications.ts` — one certification per non-blank line.
3. `dateUtils.ts` finds date-like tokens (month-year, numeric, year-only,
   or "present") independently and pairs the first two found on a line,
   rather than matching one large "start - end" regex — resume date
   formats vary too much for a single reliable pattern.

## Known limitations

This is a deterministic, rule-based parser, not a resume-specific ML
model — it works well for conventionally-formatted resumes and degrades
gracefully (never crashes, never fabricates data) on unconventional ones:

- **Title/company order**: when an experience entry's meta line has no
  recognizable job-title keyword on either side of the separator, the
  parser defaults to "Title, Company" order. A resume using "Company,
  Title" order without a recognizable title keyword will have those two
  swapped.
- **Ambiguous or missing separators**: if a meta line can't be split at
  all (no comma/pipe/dash/"at"), the whole line becomes `title` and
  `company` is left as an empty string — a warning is added rather than
  guessing a company name.
- **Location matching** requires a 2-letter code after the comma (e.g.
  "Austin, TX"). This is a deliberate trade-off: an earlier, looser
  pattern that also matched any capitalized word (to also catch "Austin,
  Texas") produced false positives that corrupted title/company parsing
  (e.g. treating "Software Engineer, Beta" as a location). Missing a
  spelled-out state/country is preferred over corrupting other fields.
- **Multi-column or heavily tabular PDF layouts**: pdf.js extracts text in
  the order the PDF encodes it, which for multi-column resumes may not
  match visual reading order. This is a real limitation of PDF text
  extraction in general — and not coincidentally, exactly the kind of
  formatting the ATS Compatibility engine (TASK-008) flags as a risk.
- **Education without bullets**: the `EducationEntry` schema (TASK-003)
  intentionally has no `bullets` field, so honors/coursework lines within
  an education block aren't captured — this is a schema decision, not a
  parser bug.

## Error handling

`parseResumeFile` throws `ResumeParseError` for file-level problems
(unsupported type, empty file, too large) before ever attempting
extraction. `parseResumeText` never throws: an empty or very-short
document still returns a `Resume` (empty, or partially populated) plus a
`warnings: string[]` explaining what couldn't be found — so the UI always
has something to render instead of a blank screen (see the "ERROR STATES"
requirements in `AGENTS.md`).

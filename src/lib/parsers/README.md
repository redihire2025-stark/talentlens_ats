# lib/parsers

Resume (PDF/DOCX) and job description (plain text or PDF/DOCX) parsing into
the typed schemas defined in `src/types`.

- `shared/` — PDF/DOCX text extraction (pdfjs-dist + mammoth) and file
  validation, shared by both parsers below since they accept the same
  document types.
- `resume/` — implemented in TASK-004. See
  `docs/architecture/resume-parser.md` for the extraction/parsing split and
  known limitations.
- `jd/` — implemented in TASK-006. See `docs/architecture/jd-parser.md`.

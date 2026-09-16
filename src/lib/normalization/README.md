# lib/normalization

Reusable canonicalization layer, implemented in TASK-007. Every engine that
compares two pieces of text (matching, ATS keyword analysis) goes through
this module instead of hardcoding its own string comparisons.

- `lookupKey.ts` — `toLookupKey`, the shared alnum-only key both
  dictionaries below use so spacing/punctuation variants collide
- `skillSynonyms.ts` — raw, extensible skill synonym data
- `skillDictionary.ts` — compiled lookup + `normalizeSkillName`
- `titleSeniority.ts` — strips a seniority prefix ("Senior", "Staff", …)
- `titleSynonyms.ts` — raw core-title synonym data + lookup
- `normalizeTitle.ts` — combines the two above into `{ seniority, coreTitle }`
- `keywordNormalization.ts` — generic trim/lowercase/collapse-whitespace
  fallback for keywords that aren't specifically a skill or title

Unrecognized input never gets dropped — every normalizer falls back to a
plain lowercase/trim rather than erroring or discarding the value, so an
unknown skill still participates in matching, just without a dictionary
merge.

# lib/normalization

Reusable canonicalization layer: `skillDictionary`, `skillSynonyms`,
`titleSynonyms`, `keywordNormalization`. Every engine that compares two
pieces of text (matching, ATS keyword analysis) goes through this module
instead of hardcoding its own string comparisons. Implemented in TASK-007.

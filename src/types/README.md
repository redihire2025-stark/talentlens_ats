# types

Shared TypeScript types for the whole app: the `Resume` and `JobDescription`
domain schemas, scoring/match result shapes, and API request/response
contracts. No `any`-based structures — every shape used across features is
defined here and imported, not redeclared.

Populated in TASK-002 (shared types) / TASK-003 (resume schema) / TASK-005
(JD schema).

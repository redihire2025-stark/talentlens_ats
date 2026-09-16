/** Opaque identifier for in-memory session entities (resume versions, etc.). */
export type Id = string

/** ISO 8601 date string, e.g. "2024-03-01". */
export type ISODateString = string

/**
 * Marks a field as explicitly absent rather than merely optional.
 * Used, for example, for an in-progress job's `endDate`.
 */
export type Nullable<T> = T | null

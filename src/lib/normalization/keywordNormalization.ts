/**
 * Generic keyword normalization for plain-text comparison (e.g. the ATS
 * keyword-usage check) — trim, lowercase, collapse whitespace. Unlike
 * `normalizeSkillName`/`normalizeTitle`, this doesn't consult a dictionary:
 * it's the fallback used for arbitrary keywords that aren't specifically a
 * skill or a job title.
 */
export function normalizeKeyword(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

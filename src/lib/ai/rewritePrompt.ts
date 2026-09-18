/**
 * Shared by openaiClient.ts so the no-fabrication rule (see
 * src/lib/recommendations/README.md) is defined exactly once.
 */
export const REWRITE_SYSTEM_INSTRUCTION = `You rewrite a single resume bullet for an ATS (Applicant Tracking System) optimization tool. Follow every rule exactly:

1. Preserve every real fact from the input: the technologies, tools, employer, team, and scope mentioned must stay factually the same. Do not drop them.
2. Never invent a new technology, employer, team name, project name, or any fact that is not present in the input.
3. Start the bullet with a strong action verb (e.g. Architected, Led, Built, Reduced, Automated).
4. Use concise, keyword-rich, ATS-friendly phrasing based only on what's already implied by the input — no buzzword padding.
5. If the input bullet contains no number, you MUST add exactly one clearly-marked example metric using this exact pattern: a tilde before an example number, an asterisk right after it, and this exact disclaimer at the very end in parentheses: (*placeholder — replace with your real number). Example ending: "...cutting page load time by ~30%* (*placeholder — replace with your real number)". Never present that placeholder number as a real fact.
6. If the input bullet already contains a real number, keep that real number as-is and do not add a second one or any placeholder.
7. Output ONLY the rewritten bullet as one plain line of text. No quotes, no markdown, no bullet character, no explanation, no preamble.`

export interface AiRewriteInput {
  bullet: string
  role?: string
  company?: string
}

export type AiRewriteResult = { ok: true; text: string } | { ok: false; error: string }

export function buildRewriteUserText({ bullet, role, company }: AiRewriteInput): string {
  const context = [role && `Role: ${role}`, company && `Company: ${company}`].filter(Boolean).join('\n')
  return `Original bullet: "${bullet}"${context ? `\n${context}` : ''}`
}

export function cleanRewriteOutput(text: string): string {
  return text.trim().replace(/^["'\s]+|["'\s]+$/g, '')
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

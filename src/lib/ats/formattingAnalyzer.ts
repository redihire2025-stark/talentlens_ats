import type { AnalyzerResult, AtsAnalysisInput } from './types'

/**
 * True document-level formatting checks (tables, images, embedded
 * objects, headers/footers, exotic fonts) require the original file's
 * bytes and layout, which the ATS engine doesn't receive — it operates on
 * the already-parsed Resume JSON (see docs/architecture/overview.md's data
 * flow). What's checked here is inferred from the parse result instead:
 * parser warnings that suggest a scanned/image-based or malformed
 * document, and the absence of bullet-point formatting in experience
 * entries (paragraph-style resumes are a real, well-documented ATS
 * formatting risk in their own right).
 */
export function analyzeFormatting({ resume, parserWarnings }: AtsAnalysisInput): AnalyzerResult {
  const issues: string[] = []
  let penalty = 0

  const hadParsingTrouble = parserWarnings.some((warning) => /no text could be extracted|very short/i.test(warning))
  if (hadParsingTrouble) {
    issues.push('The document may use a format (e.g. a scanned image) that is hard for automated systems to read.')
    penalty += 40
  }

  const entriesWithoutBullets = resume.experience.filter((entry) => entry.bullets.length === 0).length
  if (resume.experience.length > 0 && entriesWithoutBullets > 0) {
    issues.push(`${entriesWithoutBullets} experience ${entriesWithoutBullets === 1 ? 'entry uses' : 'entries use'} paragraph text instead of bullet points.`)
    penalty += Math.min(30, entriesWithoutBullets * 10)
  }

  const score = Math.max(0, 100 - penalty)

  return {
    score,
    strengths: issues.length === 0 ? ['No formatting risks were detected in the parsed content.'] : [],
    issues,
    explanation:
      issues.length === 0
        ? 'The resume uses clear, ATS-friendly structure: bulleted experience and clean text extraction.'
        : issues.join(' '),
  }
}

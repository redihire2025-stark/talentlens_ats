import type { AnalyzerResult, AtsAnalysisInput } from './types'

const CRITICAL_WARNING_PATTERNS = [/no text could be extracted/i]
const MODERATE_WARNING_PATTERNS = [/very short/i]

/**
 * Scores how cleanly the document could be extracted and structured, based
 * on the resume parser's own warnings (TASK-004) rather than re-deriving
 * parse quality here. A document the parser flagged as empty or very short
 * is exactly the kind of document a real ATS would also struggle with.
 */
export function analyzeParsing({ parserWarnings }: AtsAnalysisInput): AnalyzerResult {
  const hasCritical = parserWarnings.some((warning) => CRITICAL_WARNING_PATTERNS.some((pattern) => pattern.test(warning)))
  const hasModerate = parserWarnings.some((warning) => MODERATE_WARNING_PATTERNS.some((pattern) => pattern.test(warning)))

  if (hasCritical) {
    return {
      score: 0,
      strengths: [],
      issues: ['No text could be extracted from the document.'],
      explanation: 'The document could not be read as text at all — it may be a scanned image or corrupted.',
    }
  }

  if (hasModerate) {
    return {
      score: 40,
      strengths: [],
      issues: ['The document is very short for a resume.'],
      explanation: 'Very little text was found, so most of the analysis below is likely incomplete.',
    }
  }

  const otherWarningCount = parserWarnings.length
  const score = otherWarningCount === 0 ? 100 : Math.max(70, 100 - otherWarningCount * 10)

  return {
    score,
    strengths: ['The document parsed cleanly into text.'],
    issues: otherWarningCount > 0 ? [...parserWarnings] : [],
    explanation:
      otherWarningCount === 0
        ? 'The document extracted cleanly with no parsing warnings.'
        : `The document parsed, but with ${otherWarningCount} warning${otherWarningCount === 1 ? '' : 's'} — see details below.`,
  }
}

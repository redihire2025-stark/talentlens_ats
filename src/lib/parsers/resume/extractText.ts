import { extractDocumentText } from '../shared/extractDocumentText'
import type { ResumeSourceFormat } from './validateFile'

export function extractResumeText(file: File, sourceFormat: ResumeSourceFormat): Promise<string> {
  return extractDocumentText(file, sourceFormat)
}

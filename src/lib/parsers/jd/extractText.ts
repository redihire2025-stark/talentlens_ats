import { extractDocumentText } from '../shared/extractDocumentText'
import type { JobDescriptionSourceFormat } from './validateFile'

export function extractJobDescriptionText(file: File, sourceFormat: JobDescriptionSourceFormat): Promise<string> {
  return extractDocumentText(file, sourceFormat)
}

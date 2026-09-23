import type { Evidence, EvidenceSection } from '@/types/evidence'

/** Evidence that quotes the resume verbatim — the default, and nearly always the right choice. */
export function explicitEvidence(text: string, section: EvidenceSection, entryId?: string, confidence = 1): Evidence {
  return entryId === undefined
    ? { text, section, sourceType: 'explicit', confidence }
    : { text, section, entryId, sourceType: 'explicit', confidence }
}

/** Evidence for a fact inferred from the resume's structure where no single literal quote exists (e.g. "3 experience entries were detected"). */
export function structuralEvidence(text: string, section: EvidenceSection, entryId?: string, confidence = 1): Evidence {
  return entryId === undefined
    ? { text, section, sourceType: 'inferred-from-structure', confidence }
    : { text, section, entryId, sourceType: 'inferred-from-structure', confidence }
}

/** Distinct evidence by (text, section, entryId), first occurrence wins — keeps merged evidence lists from repeating the same quote. */
export function dedupeEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>()
  return evidence.filter((e) => {
    const key = `${e.section}\u0000${e.entryId ?? ''}\u0000${e.text}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

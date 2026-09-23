import type { Resume } from '@/types/resume'

/**
 * A human-readable summary of what changed between two Resume snapshots —
 * shown on a saved version and in the Before/After view. Deliberately
 * describes *where* something changed, not the exact diff text; the
 * before/after content itself is still available from each version's own
 * `resume`.
 */
export function diffResumeChanges(before: Resume, after: Resume): string[] {
  const changes: string[] = []

  if (before.summary !== after.summary) {
    changes.push('Summary updated.')
  }

  const beforeSkills = before.skills.map((s) => s.rawName).join(',')
  const afterSkills = after.skills.map((s) => s.rawName).join(',')
  if (beforeSkills !== afterSkills) {
    changes.push('Skills updated.')
  }

  const entryCount = Math.max(before.experience.length, after.experience.length)
  for (let i = 0; i < entryCount; i++) {
    const beforeEntry = before.experience[i]
    const afterEntry = after.experience[i]
    if (!beforeEntry || !afterEntry) continue

    const label = afterEntry.company || afterEntry.title || `role ${i + 1}`
    if (beforeEntry.title !== afterEntry.title || beforeEntry.company !== afterEntry.company) {
      changes.push(`Title or company updated for ${label}.`)
    }

    const bulletCount = Math.max(beforeEntry.bullets.length, afterEntry.bullets.length)
    for (let b = 0; b < bulletCount; b++) {
      if (beforeEntry.bullets[b]?.text !== afterEntry.bullets[b]?.text) {
        changes.push(`A bullet was updated under ${label}.`)
        break
      }
    }
  }

  return changes
}

import type { ProjectEntry } from '@/types/resume'
import { buildProjectEntry } from '@/lib/schema/resumeBuilders'
import { isBulletLine, splitIntoBlocks, stripBulletMarker } from './blocks'

const TECH_LABEL_RE = /^(technologies|tech stack|stack|tools)\s*:\s*(.+)$/i
const URL_RE = /\bhttps?:\/\/[^\s,;)]+/i

function parseProjectBlock(block: string[], index: number): ProjectEntry {
  const [firstLine, ...rest] = block
  const [name, inlineDescription] = (firstLine ?? '')
    .split(/\s*(?:-|–|—|:)\s*/, 2)
    .map((part) => part.trim())

  let technologies: string[] = []
  let url: string | null = null
  const bulletLines: string[] = []
  let description = inlineDescription ?? null

  for (const line of rest) {
    const techMatch = line.match(TECH_LABEL_RE)
    if (techMatch) {
      technologies = techMatch[2]!.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
      continue
    }

    const urlMatch = line.match(URL_RE)
    if (urlMatch && !url) url = urlMatch[0]

    if (isBulletLine(line)) {
      bulletLines.push(stripBulletMarker(line))
      continue
    }

    // A line that was only a URL shouldn't also become a description/bullet.
    const lineWithoutUrl = urlMatch ? line.replace(urlMatch[0], '').trim() : line.trim()
    if (!lineWithoutUrl) continue
    if (!description) {
      description = lineWithoutUrl
    } else if (bulletLines.length > 0) {
      // A bullet wrapped across two lines by the extractor, not a new item —
      // join with a space rather than truncating the previous bullet and
      // adding a stray fragment as its own entry.
      bulletLines[bulletLines.length - 1] = `${bulletLines[bulletLines.length - 1]} ${lineWithoutUrl}`.trim()
    } else {
      bulletLines.push(lineWithoutUrl)
    }
  }

  return buildProjectEntry(
    {
      name: name || (firstLine ?? '').trim(),
      description,
      bullets: bulletLines.filter(Boolean),
      technologies,
      url,
      sourceLines: firstLine ? [firstLine.trim()] : [],
    },
    index,
  )
}

export function buildProjects(projectLines: string[]): ProjectEntry[] {
  return splitIntoBlocks(projectLines).map(parseProjectBlock)
}

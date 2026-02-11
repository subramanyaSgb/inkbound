import type { StoryProfile } from '@/types'

const RELATIONSHIP_PATTERNS: { pattern: RegExp; relationship: string }[] = [
  { pattern: /\bmy wife\b/i, relationship: 'wife' },
  { pattern: /\bmy husband\b/i, relationship: 'husband' },
  { pattern: /\bmy girlfriend\b/i, relationship: 'girlfriend' },
  { pattern: /\bmy boyfriend\b/i, relationship: 'boyfriend' },
  { pattern: /\bmy mom\b|\bmy mother\b/i, relationship: 'mother' },
  { pattern: /\bmy dad\b|\bmy father\b/i, relationship: 'father' },
  { pattern: /\bmy brother\b/i, relationship: 'brother' },
  { pattern: /\bmy sister\b/i, relationship: 'sister' },
  { pattern: /\bmy son\b/i, relationship: 'son' },
  { pattern: /\bmy daughter\b/i, relationship: 'daughter' },
  { pattern: /\bmy boss\b/i, relationship: 'boss' },
  { pattern: /\bmy best friend\b/i, relationship: 'best friend' },
  { pattern: /\bmy friend\b/i, relationship: 'friend' },
  { pattern: /\bmy colleague\b|\bmy coworker\b/i, relationship: 'colleague' },
  { pattern: /\bmy uncle\b/i, relationship: 'uncle' },
  { pattern: /\bmy aunt\b/i, relationship: 'aunt' },
  { pattern: /\bmy grandma\b|\bmy grandmother\b/i, relationship: 'grandmother' },
  { pattern: /\bmy grandpa\b|\bmy grandfather\b/i, relationship: 'grandfather' },
  { pattern: /\bmy partner\b/i, relationship: 'partner' },
  { pattern: /\bmy roommate\b/i, relationship: 'roommate' },
  { pattern: /\bour apartment\b|\bour house\b|\bour home\b/i, relationship: 'home' },
  { pattern: /\bmy office\b|\bthe office\b/i, relationship: 'office' },
]

export interface UnknownReference {
  keyword: string
  relationship: string
  type: 'character' | 'location'
}

export function scanForUnknownReferences(
  text: string,
  existingProfiles: StoryProfile[]
): UnknownReference[] {
  const unknowns: UnknownReference[] = []
  const foundRelationships = new Set<string>()

  // 1. Check @ mentions
  const mentionRegex = /@(\w+)/g
  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionName = match[1]
    const found = existingProfiles.find(
      p => p.name.toLowerCase() === mentionName.toLowerCase() ||
           p.nickname?.toLowerCase() === mentionName.toLowerCase()
    )
    if (!found) {
      unknowns.push({
        keyword: `@${mentionName}`,
        relationship: 'unknown',
        type: 'character',
      })
    }
  }

  // 2. Check relationship keywords
  for (const { pattern, relationship } of RELATIONSHIP_PATTERNS) {
    if (pattern.test(text)) {
      const isLocation = ['home', 'office'].includes(relationship)
      const found = existingProfiles.find(p => {
        if (isLocation) return p.type === 'location' && p.relationship === relationship
        return p.type === 'character' && p.relationship === relationship
      })

      if (!found && !foundRelationships.has(relationship)) {
        foundRelationships.add(relationship)
        unknowns.push({
          keyword: `my ${relationship}`,
          relationship,
          type: isLocation ? 'location' : 'character',
        })
      }
    }
  }

  return unknowns
}

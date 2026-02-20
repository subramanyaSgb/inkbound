import type { Novel, Chapter, StoryProfile, ProfileRelationship } from '@/types'
import { RELATIONSHIP_INVERSE_MAP, FAMILY_CATEGORIES } from '@/lib/constants'

function formatProfileDetails(details: Record<string, string> | null | undefined): string {
  if (!details) return ''
  const entries = Object.entries(details).filter(([, v]) => v)
  if (entries.length === 0) return ''
  return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
}

export function buildRelationshipContext(
  profiles: StoryProfile[],
  relationships: ProfileRelationship[]
): string {
  const profileMap = new Map<string, StoryProfile>()
  profiles.forEach(p => profileMap.set(p.id, p))

  const protagonist = profiles.find(p => p.type === 'personal')
  const locations = profiles.filter(p => p.type === 'location')

  // Build adjacency map (both directions)
  type Edge = { targetId: string; type: string }
  const adjacency = new Map<string, Edge[]>()

  const addEdge = (from: string, to: string, type: string) => {
    if (!adjacency.has(from)) adjacency.set(from, [])
    adjacency.get(from)!.push({ targetId: to, type })
  }

  for (const rel of relationships) {
    addEdge(rel.from_profile_id, rel.to_profile_id, rel.relationship_type)
    const inverse = RELATIONSHIP_INVERSE_MAP[rel.relationship_type] || rel.relationship_type
    addEdge(rel.to_profile_id, rel.from_profile_id, inverse)
  }

  // Track which profiles have been mentioned
  const mentionedIds = new Set<string>()

  let context = ''

  // --- Family Tree Section ---
  if (protagonist) {
    mentionedIds.add(protagonist.id)
    const protagonistEdges = adjacency.get(protagonist.id) || []

    const familyCategories = new Set<string>([...FAMILY_CATEGORIES, 'child'])
    const familyEdges = protagonistEdges.filter(e => familyCategories.has(e.type))
    const socialEdges = protagonistEdges.filter(e => !familyCategories.has(e.type))

    if (familyEdges.length > 0) {
      context += '\nFamily Tree:\n'

      // Group by relationship type
      const parents = familyEdges.filter(e => e.type === 'parent')
      const spouse = familyEdges.filter(e => e.type === 'spouse')
      const siblings = familyEdges.filter(e => e.type === 'sibling')
      const children = familyEdges.filter(e => e.type === 'child')

      for (const edge of parents) {
        const p = profileMap.get(edge.targetId)
        if (!p) continue
        mentionedIds.add(p.id)
        const dets = formatProfileDetails(p.details)
        context += `- ${p.name} (your ${edge.type}${dets ? `, ${dets}` : ''})\n`

        // Find this parent's connections (grandparents, aunts/uncles for protagonist)
        const parentEdges = adjacency.get(p.id) || []
        for (const pe of parentEdges) {
          // Skip edge back to protagonist
          if (pe.targetId === protagonist.id) continue
          const pp = profileMap.get(pe.targetId)
          if (!pp) continue
          // Skip if already mentioned as a direct family member
          if (mentionedIds.has(pp.id)) continue
          mentionedIds.add(pp.id)
          const ppDets = formatProfileDetails(pp.details)
          context += `  - ${pe.type}: ${pp.name}${ppDets ? ` (${ppDets})` : ''}\n`
        }
      }

      for (const edge of spouse) {
        const p = profileMap.get(edge.targetId)
        if (!p) continue
        mentionedIds.add(p.id)
        const dets = formatProfileDetails(p.details)
        context += `- ${p.name} (your ${edge.type}${dets ? `, ${dets}` : ''})\n`
      }

      for (const edge of siblings) {
        const p = profileMap.get(edge.targetId)
        if (!p) continue
        mentionedIds.add(p.id)
        const dets = formatProfileDetails(p.details)
        context += `- ${p.name} (your ${edge.type}${dets ? `, ${dets}` : ''})\n`
      }

      for (const edge of children) {
        const p = profileMap.get(edge.targetId)
        if (!p) continue
        mentionedIds.add(p.id)
        const dets = formatProfileDetails(p.details)
        context += `- ${p.name} (your ${edge.type}${dets ? `, ${dets}` : ''})\n`
      }
    }

    // --- Social Circle Section ---
    if (socialEdges.length > 0) {
      context += '\nSocial Circle:\n'
      for (const edge of socialEdges) {
        const p = profileMap.get(edge.targetId)
        if (!p) continue
        mentionedIds.add(p.id)
        const dets = formatProfileDetails(p.details)
        const label = p.nickname ? `, "${p.nickname}"` : ''
        context += `- ${p.name} (${edge.type}${label}${dets ? `, ${dets}` : ''})\n`
      }
    }
  }

  // --- Unconnected profiles (backward compat) ---
  const unconnected = profiles.filter(
    p => p.type === 'character' && !mentionedIds.has(p.id)
  )
  if (unconnected.length > 0) {
    context += '\nOther People:\n'
    for (const p of unconnected) {
      const dets = formatProfileDetails(p.details)
      const rel = p.relationship ? ` (${p.relationship})` : ''
      context += `- ${p.name}${rel}${dets ? `: ${dets}` : ''}\n`
    }
  }

  // --- Locations ---
  if (locations.length > 0) {
    context += '\nLocations:\n'
    for (const p of locations) {
      const dets = formatProfileDetails(p.details)
      context += `- ${p.name}${dets ? `: ${dets}` : ''}\n`
    }
  }

  // --- Relationship rules ---
  context += `
RELATIONSHIP RULES:
- Use the relationship graph above to understand how characters relate to EACH OTHER
- When the protagonist mentions "mom and aunt arguing", understand they are siblings
- Refer to characters by their names or the protagonist's natural way of addressing them
- NEVER invent relationships not listed above`

  return context
}

export function buildChapterPrompt(
  novel: Novel,
  rawEntry: string,
  entryDate: string,
  chapterNumber: number,
  volumeNumber: number,
  year: number,
  recentChapters: Pick<Chapter, 'title' | 'content' | 'mood' | 'chapter_number'>[],
  storyProfiles: StoryProfile[] = [],
  editInstruction?: string,
  relationships?: ProfileRelationship[]
): { system: string; user: string } {
  const recentContext = recentChapters.length > 0
    ? recentChapters.map(ch =>
        `Chapter ${ch.chapter_number} "${ch.title}": mood=${ch.mood}, summary: ${(ch.content || '').slice(0, 200)}...`
      ).join('\n')
    : 'No previous chapters yet. This is the beginning of the story.'

  // Build profile context — use relationship graph when available, else flat list
  let profileContext = ''

  if (relationships && relationships.length > 0 && storyProfiles.length > 0) {
    // Use structured relationship context
    profileContext = '\n' + buildRelationshipContext(storyProfiles, relationships)
  } else if (storyProfiles.length > 0) {
    // Fallback: flat profile list (backward compatible)
    const personal = storyProfiles.filter(p => p.type === 'personal')
    const characters = storyProfiles.filter(p => p.type === 'character')
    const locations = storyProfiles.filter(p => p.type === 'location')

    profileContext = '\nCHARACTER & LOCATION REFERENCE:\n'

    if (personal.length > 0) {
      profileContext += 'Protagonist details:\n'
      personal.forEach(p => {
        const dets = Object.entries(p.details || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        profileContext += `- ${p.name}${dets ? ` (${dets})` : ''}\n`
      })
    }

    if (characters.length > 0) {
      profileContext += 'People:\n'
      characters.forEach(p => {
        const dets = Object.entries(p.details || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        const rel = p.relationship ? ` (${p.relationship})` : ''
        const nick = p.nickname ? ` aka "${p.nickname}"` : ''
        profileContext += `- ${p.name}${rel}${nick}${dets ? `: ${dets}` : ''}\n`
      })
    }

    if (locations.length > 0) {
      profileContext += 'Locations:\n'
      locations.forEach(p => {
        const dets = Object.entries(p.details || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        profileContext += `- ${p.name}${dets ? `: ${dets}` : ''}\n`
      })
    }

    profileContext += `
STRICT RULES ABOUT CHARACTERS AND PLACES:
- Use ONLY the names and details listed in the CHARACTER & LOCATION REFERENCE above
- NEVER invent names, ages, appearances, or personal details for anyone
- If a person is NOT in the reference, refer to them ONLY by their relationship ("his wife", "her friend")
- If a place is NOT in the reference, use generic descriptions only`
  }

  const isAutobiography = novel.genre === 'autobiography'

  const roleDescription = isAutobiography
    ? 'You are a gifted memoirist transforming real daily experiences into a beautifully written autobiography. You write with the craft of a published memoir author.'
    : 'You are a masterful novelist transforming real daily experiences into an evolving novel. You write with the skill of a published author.'

  const instructions = isAutobiography
    ? `INSTRUCTIONS:
1. Transform the raw entry into a beautifully written memoir chapter
2. Stay TRUTHFUL to the events described — do NOT fictionalize, dramatize, or invent scenes
3. Write in ${novel.pov} person point of view
4. Use "${novel.character_name}" as the protagonist's name
5. Enhance the prose quality — make the writing elegant, but keep the events real
6. Add honest introspection and personal reflection to give depth
7. Only include dialogue if the user explicitly describes a conversation
8. Maintain narrative continuity with previous chapters
9. Chapter length: 500-1500 words based on entry richness
10. Include a chapter title
11. Include an opening epigraph/quote (original, thematic)`
    : `INSTRUCTIONS:
1. Transform the raw entry into a beautifully written novel chapter
2. Maintain the ${novel.genre} tone throughout
3. Write in ${novel.pov} person point of view
4. Use "${novel.character_name}" as the protagonist's name
5. Weave in emotional undertones and subtext
6. Make mundane moments compelling through prose quality
7. Maintain narrative continuity with previous chapters
8. Chapter length: 500-1500 words based on entry richness
9. Include natural dialogue with quotation marks when conversations are mentioned
10. Include a chapter title
11. Include an opening epigraph/quote (original, thematic)`

  const system = `${roleDescription}

NOVEL CONTEXT:
- Title: "${novel.title}"
- Protagonist name: "${novel.character_name}"
- Genre/Tone: ${novel.genre}
- POV: ${novel.pov} person
- Writing Style: ${novel.writing_style}
- Current Chapter: ${chapterNumber}
- Current Volume: ${volumeNumber} (${year})
- Date: ${entryDate}

RECENT CHAPTERS (for continuity):
${recentContext}
${profileContext}
${instructions}

RESPOND IN JSON ONLY (no markdown code fences):
{
  "title": "Chapter title",
  "opening_quote": "An original thematic quote",
  "content": "Full chapter text...",
  "mood": "reflective|joyful|anxious|melancholic|excited|angry|peaceful|confused",
  "mood_score": 0.0,
  "tags": ["tag1", "tag2"],
  "best_quote": "The single best line from this chapter"
}`

  let user = `Here is what happened on ${entryDate}:\n\n${rawEntry}`

  if (editInstruction) {
    user += `\n\nEDIT INSTRUCTION: The user wants you to regenerate this chapter with the following changes: ${editInstruction}\nKeep the same raw entry content but apply these specific modifications to the generated chapter.`
  }

  return { system, user }
}

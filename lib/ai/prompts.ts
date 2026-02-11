import type { Novel, Chapter, StoryProfile } from '@/types'

export function buildChapterPrompt(
  novel: Novel,
  rawEntry: string,
  entryDate: string,
  chapterNumber: number,
  volumeNumber: number,
  year: number,
  recentChapters: Pick<Chapter, 'title' | 'content' | 'mood' | 'chapter_number'>[],
  storyProfiles: StoryProfile[] = []
): { system: string; user: string } {
  const recentContext = recentChapters.length > 0
    ? recentChapters.map(ch =>
        `Chapter ${ch.chapter_number} "${ch.title}": mood=${ch.mood}, summary: ${ch.content.slice(0, 200)}...`
      ).join('\n')
    : 'No previous chapters yet. This is the beginning of the story.'

  // Build profile context
  let profileContext = ''
  const personal = storyProfiles.filter(p => p.type === 'personal')
  const characters = storyProfiles.filter(p => p.type === 'character')
  const locations = storyProfiles.filter(p => p.type === 'location')

  if (storyProfiles.length > 0) {
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

  const system = `You are a masterful novelist transforming real daily experiences into an evolving novel. You write with the skill of a published author.

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
INSTRUCTIONS:
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
11. Include an opening epigraph/quote (original, thematic)

RESPOND IN JSON ONLY (no markdown code fences):
{
  "title": "Chapter title",
  "opening_quote": "An original thematic quote",
  "content": "Full chapter text...",
  "mood": "reflective|joyful|anxious|melancholic|excited|angry|peaceful|confused",
  "mood_score": 0.0,
  "tags": ["tag1", "tag2"],
  "soundtrack": {"song": "...", "artist": "...", "why": "..."},
  "best_quote": "The single best line from this chapter"
}`

  const user = `Here is what happened on ${entryDate}:\n\n${rawEntry}`

  return { system, user }
}

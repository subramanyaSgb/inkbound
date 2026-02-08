import type { Novel, Chapter } from '@/types'

export function buildChapterPrompt(
  novel: Novel,
  rawEntry: string,
  entryDate: string,
  chapterNumber: number,
  volumeNumber: number,
  year: number,
  recentChapters: Pick<Chapter, 'title' | 'content' | 'mood' | 'chapter_number'>[]
): { system: string; user: string } {
  const recentContext = recentChapters.length > 0
    ? recentChapters.map(ch =>
        `Chapter ${ch.chapter_number} "${ch.title}": mood=${ch.mood}, summary: ${ch.content.slice(0, 200)}...`
      ).join('\n')
    : 'No previous chapters yet. This is the beginning of the story.'

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

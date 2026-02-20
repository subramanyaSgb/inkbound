import type { Novel, StoryProfile, ProfileRelationship } from '@/types'
import { buildRelationshipContext } from '@/lib/ai/prompts'

export const AU_GENRES = [
  { value: 'medieval', label: 'Medieval Fantasy', icon: '🏰', description: 'Knights, castles, and ancient magic' },
  { value: 'space-opera', label: 'Space Opera', icon: '🚀', description: 'Galactic empires and starships' },
  { value: 'noir', label: 'Film Noir', icon: '🕵️', description: 'Dark alleys, shadows, and mystery' },
  { value: 'cyberpunk', label: 'Cyberpunk', icon: '🤖', description: 'Neon-lit dystopian future' },
  { value: 'romcom', label: 'Romantic Comedy', icon: '💕', description: 'Light-hearted and charming' },
  { value: 'horror', label: 'Horror', icon: '👻', description: 'Psychological dread and suspense' },
  { value: 'superhero', label: 'Superhero', icon: '⚡', description: 'Powers, villains, and destiny' },
] as const

const GENRE_PROMPTS: Record<string, string> = {
  medieval: `Rewrite this day as if it took place in a medieval fantasy kingdom. Transform modern settings into castles, taverns, and enchanted forests. Modern jobs become guild roles or court positions. Technology becomes magic. Keep ALL real events, emotions, and relationships intact — only transform the setting and language.`,
  'space-opera': `Rewrite this day as if it happened aboard a massive starship or on an alien world. Transform earthly locations into space stations, planetary colonies, or ship decks. Modern roles become space fleet positions. Keep ALL real events, emotions, and relationships intact — only transform the setting to deep space.`,
  noir: `Rewrite this day in the style of a 1940s film noir detective story. The protagonist narrates in hardboiled first-person. Rain-soaked streets, shadowy figures, double meanings. Every interaction drips with tension and subtext. Keep ALL real events, emotions, and relationships intact — only transform the atmosphere and prose style.`,
  cyberpunk: `Rewrite this day as if it took place in a neon-drenched cyberpunk megacity. Augmented reality overlays, corporate towers, underground hackers. Modern tech becomes bleeding-edge implants and neural interfaces. Keep ALL real events, emotions, and relationships intact — only transform the setting to a dystopian future.`,
  romcom: `Rewrite this day as a romantic comedy screenplay. Charming inner monologue, comedic misunderstandings, meet-cute moments, witty banter. Everything gets a warm, funny, slightly exaggerated spin. Keep ALL real events, emotions, and relationships intact — amplify the humor and heart.`,
  horror: `Rewrite this day as psychological horror. Ordinary moments become deeply unsettling. Shadows linger too long. Small details feel wrong. Build slow creeping dread through atmosphere, not gore. Keep ALL real events, emotions, and relationships intact — transform the tone to suspenseful horror.`,
  superhero: `Rewrite this day as a superhero origin story. The protagonist discovers or uses extraordinary abilities. Daily challenges become epic confrontations. Mundane settings become arenas. Keep ALL real events, emotions, and relationships intact — transform the scale and stakes to superheroic.`,
}

export function buildAlternatePrompt(
  genre: string,
  novel: Novel,
  rawEntry: string,
  entryDate: string,
  storyProfiles: StoryProfile[] = [],
  relationships?: ProfileRelationship[]
): { system: string; user: string } {
  const genreInstruction = GENRE_PROMPTS[genre] || GENRE_PROMPTS.medieval

  let profileContext = ''

  if (relationships && relationships.length > 0 && storyProfiles.length > 0) {
    // Use structured relationship context
    profileContext = '\n' + buildRelationshipContext(storyProfiles, relationships)
  } else if (storyProfiles.length > 0) {
    // Fallback: flat profile list (backward compatible)
    const characters = storyProfiles.filter(p => p.type === 'character')
    const locations = storyProfiles.filter(p => p.type === 'location')

    profileContext = '\nCHARACTER REFERENCE (use these names, never invent new ones):\n'
    characters.forEach(p => {
      profileContext += `- ${p.name}${p.relationship ? ` (${p.relationship})` : ''}${p.nickname ? ` aka "${p.nickname}"` : ''}\n`
    })
    if (locations.length > 0) {
      profileContext += 'LOCATIONS:\n'
      locations.forEach(p => { profileContext += `- ${p.name}\n` })
    }
  }

  const system = `You are a masterful novelist who reimagines real daily experiences in alternate genres.

ORIGINAL NOVEL CONTEXT:
- Title: "${novel.title}"
- Protagonist: "${novel.character_name}"
- Original genre: ${novel.genre}

ALTERNATE UNIVERSE GENRE INSTRUCTIONS:
${genreInstruction}
${profileContext}
STRICT RULES:
- Keep ALL real events, people, and emotional beats from the original entry
- Transform ONLY the setting, language, metaphors, and atmosphere
- Use character names from the reference — NEVER invent names
- Maintain the same emotional arc and relationships
- Chapter length: 500-1500 words

RESPOND IN JSON ONLY (no markdown code fences):
{
  "title": "Chapter title in the alternate genre style",
  "opening_quote": "A thematic quote matching the alternate genre",
  "content": "Full reimagined chapter text...",
  "mood": "reflective|joyful|anxious|melancholic|excited|angry|peaceful|confused"
}`

  const user = `Here is what happened on ${entryDate}:\n\n${rawEntry}`

  return { system, user }
}

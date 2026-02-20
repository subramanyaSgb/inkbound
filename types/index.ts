export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  preferred_theme: string
  streak_count: number
  longest_streak: number
  last_entry_date: string | null
  created_at: string
  updated_at: string
}

export interface Novel {
  id: string
  user_id: string
  title: string
  character_name: string
  genre: Genre
  pov: POV
  writing_style: WritingStyle
  cover_image_url: string | null
  cover_prompt: string | null
  start_date: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Volume {
  id: string
  novel_id: string
  year: number
  volume_number: number
  title: string | null
  prologue: string | null
  epilogue: string | null
  cover_image_url: string | null
  created_at: string
}

export interface Chapter {
  id: string
  novel_id: string
  volume_id: string | null
  chapter_number: number
  title: string | null
  content: string
  raw_entry: string
  entry_mode: EntryMode
  entry_date: string
  mood: string | null
  mood_score: number | null
  tags: string[]
  opening_quote: string | null
  illustration_url: string | null
  soundtrack_suggestion: string | null
  is_bookmarked: boolean
  is_summary: boolean
  summary_type: string | null
  word_count: number
  version: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type Genre = 'literary' | 'comedy' | 'thriller' | 'fantasy' | 'romance' | 'scifi' | 'poetic' | 'noir' | 'autobiography'
export type POV = 'first' | 'third' | 'second'
export type WritingStyle = 'modern' | 'classic' | 'murakami' | 'hemingway' | 'whimsical' | 'stream'
export type EntryMode = 'freeform' | 'structured'

export interface ChapterGenerationResponse {
  title: string
  opening_quote: string
  content: string
  mood: string
  mood_score: number
  tags: string[]
  new_characters: { name: string; relationship: string; traits: string[] }[]
  new_places: { name: string; description: string }[]
  soundtrack: { song: string; artist: string; why: string }
  best_quote: string
}

export type StoryProfileType = 'personal' | 'character' | 'location'

export interface StoryProfile {
  id: string
  user_id: string
  type: StoryProfileType
  name: string
  relationship: string | null
  nickname: string | null
  details: Record<string, string>
  archetype: string | null
  portrait_url: string | null
  first_chapter_id: string | null
  mention_count: number
  created_at: string
  updated_at: string
}

export interface ReadingProgress {
  id: string
  user_id: string
  novel_id: string
  last_chapter_id: string | null
  chapters_read: number
  updated_at: string
}

export interface SavedQuote {
  id: string
  user_id: string
  chapter_id: string
  novel_id: string
  text: string
  created_at: string
}

export type AlternateGenre = 'medieval' | 'space-opera' | 'noir' | 'cyberpunk' | 'romcom' | 'horror' | 'superhero'

export interface AlternateChapter {
  id: string
  chapter_id: string
  genre: AlternateGenre
  title: string | null
  content: string
  opening_quote: string | null
  mood: string | null
  word_count: number
  created_at: string
}

export interface NovelWithChapterCount extends Novel {
  chapter_count: number
  latest_chapter_date: string | null
  volume_count: number
}

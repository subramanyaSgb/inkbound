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
  created_at: string
  updated_at: string
}

export type Genre = 'literary' | 'comedy' | 'thriller' | 'fantasy' | 'romance' | 'scifi' | 'poetic' | 'noir'
export type POV = 'first' | 'third' | 'second'
export type WritingStyle = 'modern' | 'classic' | 'murakami' | 'hemingway' | 'whimsical' | 'stream'
export type EntryMode = 'freeform' | 'guided' | 'structured'

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

export interface NovelWithChapterCount extends Novel {
  chapter_count: number
  latest_chapter_date: string | null
  volume_count: number
}

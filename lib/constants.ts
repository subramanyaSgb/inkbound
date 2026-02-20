export const GENRES = [
  { value: 'literary', label: 'Literary Fiction', description: 'Elegant, character-driven prose' },
  { value: 'comedy', label: 'Comedy', description: 'Light-hearted, witty, and humorous' },
  { value: 'thriller', label: 'Thriller', description: 'Suspenseful, high-stakes tension' },
  { value: 'fantasy', label: 'Fantasy', description: 'Magical realism and wonder' },
  { value: 'romance', label: 'Romance', description: 'Warm, emotional, relationship-focused' },
  { value: 'scifi', label: 'Sci-Fi', description: 'Futuristic, analytical, exploratory' },
  { value: 'poetic', label: 'Poetic', description: 'Lyrical, metaphor-rich, artistic' },
  { value: 'noir', label: 'Noir', description: 'Dark, moody, detective-style narration' },
  { value: 'autobiography', label: 'Autobiography', description: 'Truthful, beautifully written memoir' },
] as const

export const POVS = [
  { value: 'first', label: 'First Person', description: '"I walked into the room..."' },
  { value: 'third', label: 'Third Person', description: '"They walked into the room..."' },
  { value: 'second', label: 'Second Person', description: '"You walk into the room..."' },
] as const

export const WRITING_STYLES = [
  { value: 'modern', label: 'Modern', description: 'Clean, contemporary prose' },
  { value: 'classic', label: 'Classic', description: 'Rich, formal Victorian-era style' },
  { value: 'murakami', label: 'Murakami', description: 'Surreal, introspective, dreamlike' },
  { value: 'hemingway', label: 'Hemingway', description: 'Sparse, direct, understated' },
  { value: 'whimsical', label: 'Whimsical', description: 'Playful, imaginative, fairy-tale-like' },
  { value: 'stream', label: 'Stream of Consciousness', description: 'Raw, flowing, unfiltered thought' },
] as const

export const RELATIONSHIP_TYPES = [
  { value: 'parent', label: 'Parent', description: 'Mother or father', category: 'family' },
  { value: 'sibling', label: 'Sibling', description: 'Brother or sister', category: 'family' },
  { value: 'spouse', label: 'Spouse', description: 'Husband, wife, or partner', category: 'family' },
  { value: 'friend', label: 'Friend', description: 'Close friend', category: 'social' },
  { value: 'colleague', label: 'Colleague', description: 'Coworker or professional contact', category: 'social' },
  { value: 'mentor', label: 'Mentor', description: 'Teacher, guide, or role model', category: 'social' },
] as const

export const RELATIONSHIP_INVERSE_MAP: Record<string, string> = {
  parent: 'child',
  child: 'parent',
  sibling: 'sibling',
  spouse: 'spouse',
  friend: 'friend',
  colleague: 'colleague',
  mentor: 'mentee',
  mentee: 'mentor',
}

export const SOCIAL_CATEGORIES = ['friend', 'colleague', 'mentor'] as const
export const FAMILY_CATEGORIES = ['parent', 'sibling', 'spouse'] as const

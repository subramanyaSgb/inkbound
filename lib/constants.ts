export const GENRES = [
  { value: 'literary', label: 'Literary Fiction', description: 'Elegant, character-driven prose' },
  { value: 'comedy', label: 'Comedy', description: 'Light-hearted, witty, and humorous' },
  { value: 'thriller', label: 'Thriller', description: 'Suspenseful, high-stakes tension' },
  { value: 'fantasy', label: 'Fantasy', description: 'Magical realism and wonder' },
  { value: 'romance', label: 'Romance', description: 'Warm, emotional, relationship-focused' },
  { value: 'scifi', label: 'Sci-Fi', description: 'Futuristic, analytical, exploratory' },
  { value: 'poetic', label: 'Poetic', description: 'Lyrical, metaphor-rich, artistic' },
  { value: 'noir', label: 'Noir', description: 'Dark, moody, detective-style narration' },
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

import type { Novel } from '@/types'

const GENRE_STYLES: Record<string, string> = {
  literary: 'minimalist, muted earth tones, single symbolic object, soft lighting, book cover art',
  romance: 'warm golden light, soft focus, intimate scene, gentle sunset colors, dreamy atmosphere',
  thriller: 'dark shadows, high contrast, urban landscape at night, moody blue and orange tones',
  fantasy: 'sweeping landscape, magical elements, rich saturated colors, ethereal lighting',
  scifi: 'futuristic cityscape, neon accents, space elements, clean geometric shapes',
  comedy: 'bright playful colors, whimsical illustration style, cheerful and energetic',
  poetic: 'abstract watercolor texture, flowing forms, soft pastels with gold accents',
  noir: 'black and white with single gold accent color, silhouette figures, rain-soaked city',
}

export function buildCoverImagePrompt(
  novel: Novel,
  topMoods: string[],
  topTags: string[]
): string {
  const genreStyle = GENRE_STYLES[novel.genre] || GENRE_STYLES.literary
  const moodContext = topMoods.length > 0 ? `Emotional tone: ${topMoods.join(', ')}.` : ''
  const themeContext = topTags.length > 0 ? `Themes: ${topTags.join(', ')}.` : ''

  return `Book cover art for a novel titled "${novel.title}". ${genreStyle}. ${moodContext} ${themeContext} Professional publishing quality, no text or letters on the image, cinematic composition, atmospheric depth. Dark background compatible with gold overlay text.`
}

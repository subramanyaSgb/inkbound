import type { Novel } from '@/types'

const GENRE_ART_STYLES: Record<string, string> = {
  literary: 'oil painting, impasto brushwork, muted earth palette, gallery-quality fine art, warm undertones',
  romance: 'soft digital painting, golden hour lighting, bokeh background, warm amber and rose tones, dreamy atmosphere',
  thriller: 'digital matte painting, neo-noir aesthetic, deep shadows, desaturated teal and burnt orange, tension',
  fantasy: 'concept art, sweeping epic landscape, rich saturated jewel tones, ethereal volumetric lighting, magical',
  scifi: 'sci-fi concept art, futuristic architecture, neon cyan and magenta accents, atmospheric fog, clean geometry',
  comedy: 'vibrant digital illustration, playful warm colors, whimsical composition, cheerful energy, pop art influence',
  poetic: 'abstract watercolor, flowing organic forms, soft pastels with metallic gold leaf accents, delicate texture',
  noir: 'monochrome ink wash with single gold accent, film grain texture, silhouette composition, 1940s atmosphere',
}

const QUALITY_TAGS = 'masterpiece, best quality, 4k, highly detailed, cinematic composition, professional book cover art, atmospheric depth, dark moody background'
const NEGATIVE_TAGS = 'text, words, letters, title, watermark, signature, blurry, low quality, human face, portrait, person, figure, hand, deformed, ugly, amateur'

export function buildSceneExtractionPrompt(chapterContent: string): string {
  return `You are a book cover art director. Given chapter content from a personal novel, identify the single most visually compelling scene, symbol, or setting.

Rules:
- Describe ONLY visual elements: setting, objects, lighting, colors, weather, time of day
- NO people, faces, or human figures
- Focus on atmosphere and emotion through environment
- Use concrete, specific details (not "a beautiful sunset" but "amber light bleeding through storm clouds over a tin-roofed village")
- Keep it to 2-3 sentences, under 60 words
- If the story is about mundane daily life, find beauty in small details (a cluttered desk, rain on a window, steam rising from a cup)
- Output ONLY the visual description, nothing else

Chapter content:
${chapterContent}`
}

export function buildCoverImagePrompt(
  novel: Novel,
  sceneDescription: string
): string {
  const artStyle = GENRE_ART_STYLES[novel.genre] || GENRE_ART_STYLES.literary

  return `${sceneDescription}, ${artStyle}, ${QUALITY_TAGS}`
}

export function getNegativePrompt(): string {
  return NEGATIVE_TAGS
}

// Fallback for novels with no chapters yet
export function buildFallbackPrompt(novel: Novel): string {
  const artStyle = GENRE_ART_STYLES[novel.genre] || GENRE_ART_STYLES.literary
  return `Evocative book cover scene for a novel titled "${novel.title}", symbolic still life composition, ${artStyle}, ${QUALITY_TAGS}`
}

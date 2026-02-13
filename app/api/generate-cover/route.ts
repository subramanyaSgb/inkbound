import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCoverImagePrompt } from '@/lib/ai/cover-prompts'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed } = checkRateLimit(`cover:${user.id}`, 3, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const { novelId } = await request.json()
    if (!novelId) {
      return NextResponse.json({ error: 'Missing novelId' }, { status: 400 })
    }

    const [novelResult, chaptersResult] = await Promise.all([
      supabase.from('novels').select('*').eq('id', novelId).single(),
      supabase
        .from('chapters')
        .select('mood, tags')
        .eq('novel_id', novelId)
        .is('deleted_at', null)
        .order('chapter_number', { ascending: false })
        .limit(10),
    ])

    if (!novelResult.data) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const novel = novelResult.data
    const chapters = chaptersResult.data || []

    const moodCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    for (const ch of chapters) {
      if (ch.mood) moodCounts[ch.mood] = (moodCounts[ch.mood] || 0) + 1
      for (const tag of (ch.tags || [])) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }
    const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => m)
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)

    const imagePrompt = buildCoverImagePrompt(novel, topMoods, topTags)

    const imageResponse = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          { text: imagePrompt, weight: 1 },
          { text: 'text, letters, words, watermark, ugly, blurry, deformed', weight: -1 },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1,
      }),
    })

    if (!imageResponse.ok) {
      const err = await imageResponse.text()
      console.error(`NVIDIA Image API error (${imageResponse.status}):`, err)
      if (imageResponse.status === 401 || imageResponse.status === 403) {
        return NextResponse.json({ error: 'NVIDIA API key does not have access to image generation. Check your API key permissions at build.nvidia.com.' }, { status: 502 })
      }
      if (imageResponse.status === 402 || imageResponse.status === 429) {
        return NextResponse.json({ error: 'NVIDIA API credits exhausted or rate limited. Please try again later.' }, { status: 502 })
      }
      return NextResponse.json({ error: `Image generation failed (${imageResponse.status}). Please try again.` }, { status: 502 })
    }

    let imageData
    try {
      imageData = await imageResponse.json()
    } catch {
      console.error('Failed to parse NVIDIA image response')
      return NextResponse.json({ error: 'Invalid response from image API.' }, { status: 502 })
    }

    const base64Image = imageData.artifacts?.[0]?.base64

    if (!base64Image) {
      console.error('No artifacts in NVIDIA response:', JSON.stringify(imageData).slice(0, 500))
      return NextResponse.json({ error: 'No image was generated. The model may be temporarily unavailable.' }, { status: 502 })
    }

    const buffer = Buffer.from(base64Image, 'base64')
    const fileName = `covers/${user.id}/${novelId}/${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      const hint = uploadError.message?.includes('not found')
        ? ' Make sure the "covers" storage bucket exists in your Supabase project.'
        : ''
      return NextResponse.json({ error: `Failed to save cover image.${hint}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    await supabase
      .from('novels')
      .update({ cover_image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', novelId)

    return NextResponse.json({ coverUrl: publicUrl })
  } catch (error) {
    console.error('Cover generation error:', error)
    return NextResponse.json({ error: 'Failed to generate cover' }, { status: 500 })
  }
}

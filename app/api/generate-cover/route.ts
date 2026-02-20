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

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured.' }, { status: 500 })
    }

    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '1K',
            },
          },
        }),
      }
    )

    if (!imageResponse.ok) {
      const err = await imageResponse.text()
      console.error(`Gemini Image API error (${imageResponse.status}):`, err)
      if (imageResponse.status === 401 || imageResponse.status === 403) {
        return NextResponse.json({ error: 'Gemini API key is invalid or lacks permissions.' }, { status: 502 })
      }
      if (imageResponse.status === 429) {
        return NextResponse.json({ error: 'Gemini API rate limited. Please try again later.' }, { status: 502 })
      }
      return NextResponse.json({ error: `Image generation failed (${imageResponse.status}). Please try again.` }, { status: 502 })
    }

    let imageData
    try {
      imageData = await imageResponse.json()
    } catch {
      console.error('Failed to parse Gemini image response')
      return NextResponse.json({ error: 'Invalid response from image API.' }, { status: 502 })
    }

    // Extract base64 image from Gemini response parts
    const parts = imageData.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p: { inline_data?: { mime_type: string; data: string } }) => p.inline_data?.data)
    const base64Image = imagePart?.inline_data?.data

    if (!base64Image) {
      console.error('No image in Gemini response:', JSON.stringify(imageData).slice(0, 500))
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

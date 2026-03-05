import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSceneExtractionPrompt, buildCoverImagePrompt, buildFallbackPrompt } from '@/lib/ai/cover-prompts'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_CHAPTER_CHARS = 6000 // ~1500 tokens per chapter, 5 chapters max

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

    // Fetch novel + last 5 chapters with content
    const [novelResult, chaptersResult] = await Promise.all([
      supabase.from('novels').select('*').eq('id', novelId).single(),
      supabase
        .from('chapters')
        .select('content')
        .eq('novel_id', novelId)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('chapter_number', { ascending: false })
        .limit(5),
    ])

    if (!novelResult.data) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const novel = novelResult.data
    const chapters = chaptersResult.data || []

    // If no chapters yet, use fallback prompt
    if (chapters.length === 0 || !chapters.some(c => c.content?.trim())) {
      const imagePrompt = buildFallbackPrompt(novel)
      return NextResponse.json({ prompt: imagePrompt, userId: user.id })
    }

    // Truncate and combine chapter content
    const combinedContent = chapters
      .filter(c => c.content?.trim())
      .map(c => c.content!.slice(0, MAX_CHAPTER_CHARS))
      .join('\n\n---\n\n')
      .slice(0, MAX_CHAPTER_CHARS * 3) // Hard cap at ~18k chars

    // Step 1: Extract visual scene using Kimi K2.5
    const scenePrompt = buildSceneExtractionPrompt(combinedContent)

    const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: [
          { role: 'user', content: scenePrompt },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    })

    if (!aiResponse.ok) {
      console.error('Scene extraction failed:', await aiResponse.text())
      // Fallback to title-based prompt if AI fails
      const imagePrompt = buildFallbackPrompt(novel)
      return NextResponse.json({ prompt: imagePrompt, userId: user.id })
    }

    const aiData = await aiResponse.json()
    const sceneDescription = aiData.choices?.[0]?.message?.content?.trim()

    if (!sceneDescription) {
      const imagePrompt = buildFallbackPrompt(novel)
      return NextResponse.json({ prompt: imagePrompt, userId: user.id })
    }

    // Step 2: Build the final image prompt
    const imagePrompt = buildCoverImagePrompt(novel, sceneDescription)

    return NextResponse.json({ prompt: imagePrompt, userId: user.id })
  } catch (error) {
    console.error('Cover prompt error:', error)
    return NextResponse.json({ error: 'Failed to build cover prompt' }, { status: 500 })
  }
}

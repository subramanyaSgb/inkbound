import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCoverImagePrompt } from '@/lib/ai/cover-prompts'
import { checkRateLimit } from '@/lib/rate-limit'

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

    return NextResponse.json({ prompt: imagePrompt, userId: user.id })
  } catch (error) {
    console.error('Cover prompt error:', error)
    return NextResponse.json({ error: 'Failed to build cover prompt' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildAlternatePrompt } from '@/lib/ai/alternate-prompts'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed } = checkRateLimit(`alternate:${user.id}`, 5, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { chapterId, genre } = await request.json()

    if (!chapterId || !genre) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: chapter } = await supabase
      .from('chapters')
      .select('novel_id, raw_entry, entry_date')
      .eq('id', chapterId)
      .single()

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const [novelResult, profilesResult] = await Promise.all([
      supabase.from('novels').select('*').eq('id', chapter.novel_id).single(),
      supabase.from('story_profiles').select('*').eq('user_id', user.id),
    ])

    if (!novelResult.data) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const { system, user: userPrompt } = buildAlternatePrompt(
      genre, novelResult.data, chapter.raw_entry, chapter.entry_date, profilesResult.data || []
    )

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 1.0,
        stream: false,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`NVIDIA API error (${response.status}):`, err)
      return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 })
    }

    const data = await response.json()
    const text: string = data.choices?.[0]?.message?.content || ''
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid response. Please try again.' }, { status: 502 })
    }

    const { data: altChapter, error: insertError } = await supabase
      .from('alternate_chapters')
      .insert({
        chapter_id: chapterId,
        genre,
        title: parsed.title,
        content: parsed.content,
        opening_quote: parsed.opening_quote,
        mood: parsed.mood,
        word_count: parsed.content?.split(/\s+/).length || 0,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ alternateChapterId: altChapter.id })
  } catch (error) {
    console.error('Alternate generation error:', error)
    return NextResponse.json({ error: 'Failed to generate alternate chapter' }, { status: 500 })
  }
}

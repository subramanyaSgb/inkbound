import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { novelId } = await request.json()

    let query = supabase
      .from('chapters')
      .select('mood, mood_score, tags, title')
      .is('deleted_at', null)
      .order('entry_date', { ascending: false })
      .limit(10)

    if (novelId) {
      query = query.eq('novel_id', novelId)
    }

    const { data: chapters } = await query

    if (!chapters || chapters.length < 3) {
      return NextResponse.json({
        genre: 'Coming Soon',
        explanation: 'Write at least 3 chapters to discover what genre your life resembles.',
      })
    }

    const moods = chapters.map(c => c.mood).filter(Boolean).join(', ')
    const tags = [...new Set(chapters.flatMap(c => c.tags))].join(', ')
    const avgScore = chapters.reduce((s, c) => s + (c.mood_score || 0.5), 0) / chapters.length

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: [
          {
            role: 'system',
            content: 'You analyze life story data and determine what literary genre it most resembles. Respond in JSON only: {"genre": "Genre Name", "explanation": "2-3 sentence explanation"}'
          },
          {
            role: 'user',
            content: `Recent moods: ${moods}\nRecurring themes: ${tags}\nAverage mood score: ${(avgScore * 100).toFixed(0)}%\nChapter titles: ${chapters.map(c => c.title).filter(Boolean).join(', ')}\n\nWhat literary genre does this person's recent life most resemble?`
          },
        ],
        max_tokens: 256,
        temperature: 0.8,
        stream: false,
      }),
    })

    if (!response.ok) throw new Error('AI API error')

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({
      genre: 'Literary Fiction',
      explanation: 'Your life reads like a thoughtful literary work — nuanced, layered, and full of quiet revelations.',
    })
  }
}

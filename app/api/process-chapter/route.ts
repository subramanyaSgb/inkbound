import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildChapterPrompt } from '@/lib/ai/prompts'
import { generateChapter } from '@/lib/ai/chapter-generator'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  let chapterId: string | undefined

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    chapterId = body.chapterId
    const editInstruction: string | undefined = body.editInstruction

    if (!chapterId) {
      return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 })
    }

    // Fetch the chapter (must be in 'generating' state)
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('status', 'generating')
      .single()

    if (chapterError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found or not in generating state' }, { status: 404 })
    }

    // Fetch novel
    const { data: novel } = await supabase
      .from('novels')
      .select('*')
      .eq('id', chapter.novel_id)
      .single()

    if (!novel) {
      await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // Get volume info for the chapter
    let volumeNumber = 1
    let entryYear = new Date(chapter.entry_date).getFullYear()
    if (chapter.volume_id) {
      const { data: volume } = await supabase
        .from('volumes')
        .select('volume_number, year')
        .eq('id', chapter.volume_id)
        .single()
      if (volume) {
        volumeNumber = volume.volume_number
        entryYear = volume.year
      }
    }

    // Fetch context: recent chapters, profiles, relationships
    const [recentResult, profilesResult, relationshipsResult] = await Promise.all([
      supabase
        .from('chapters')
        .select('title, content, mood, chapter_number')
        .eq('novel_id', chapter.novel_id)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('chapter_number', { ascending: false })
        .limit(3),
      supabase.from('story_profiles').select('*').eq('user_id', user.id),
      supabase.from('profile_relationships').select('*').eq('user_id', user.id),
    ])

    // Build prompt
    const isQuickEdit = !!editInstruction?.trim()
    const { system, user: userPrompt } = buildChapterPrompt(
      novel,
      chapter.raw_entry,
      chapter.entry_date,
      chapter.chapter_number,
      volumeNumber,
      entryYear,
      recentResult.data || [],
      profilesResult.data || [],
      isQuickEdit ? editInstruction : undefined,
      relationshipsResult.data || []
    )

    // Call AI
    let result
    try {
      result = await generateChapter(system, userPrompt)
    } catch (genError: unknown) {
      console.error('AI generation failed for chapter', chapterId, ':', genError)
      await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      return NextResponse.json({ error: 'AI generation failed', status: 'failed' }, { status: 502 })
    }

    // Update chapter with generated content
    const { error: updateError } = await supabase
      .from('chapters')
      .update({
        status: 'completed',
        title: result.title,
        content: result.content,
        mood: result.mood,
        mood_score: result.mood_score,
        tags: result.tags,
        opening_quote: result.opening_quote,
        word_count: result.content.split(/\s+/).length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId)

    if (updateError) {
      console.error('Failed to save chapter', chapterId, ':', updateError)
      await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      return NextResponse.json({ error: 'Failed to save chapter', status: 'failed' }, { status: 500 })
    }

    // Update novel timestamp
    await supabase
      .from('novels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chapter.novel_id)

    return NextResponse.json({ chapterId, status: 'completed' })
  } catch (error: unknown) {
    console.error('Process chapter error:', error)
    // Try to mark as failed if we have the chapterId
    if (chapterId) {
      try {
        const supabase = await createClient()
        await supabase.from('chapters').update({ status: 'failed' }).eq('id', chapterId)
      } catch {
        // Best effort
      }
    }
    return NextResponse.json({ error: 'Failed to process chapter', status: 'failed' }, { status: 500 })
  }
}

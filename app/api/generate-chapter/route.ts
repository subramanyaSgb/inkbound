import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildChapterPrompt } from '@/lib/ai/prompts'
import { generateChapter } from '@/lib/ai/chapter-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { novelId, rawEntry, entryDate, chapterId } = await request.json()

    if (!novelId || !rawEntry?.trim() || !entryDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch novel
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .single()

    if (novelError || !novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // Get chapter count for chapter number
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId)

    const chapterNumber = (chapterCount || 0) + 1

    // If editing existing chapter, use its chapter number
    let finalChapterNumber = chapterNumber
    if (chapterId) {
      const { data: existingChapter } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('id', chapterId)
        .single()
      if (existingChapter) {
        finalChapterNumber = existingChapter.chapter_number
      }
    }

    // Get or create volume for the entry year
    const entryYear = new Date(entryDate).getFullYear()

    let { data: volume } = await supabase
      .from('volumes')
      .select('*')
      .eq('novel_id', novelId)
      .eq('year', entryYear)
      .single()

    if (!volume) {
      const { count: volumeCount } = await supabase
        .from('volumes')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelId)

      const { data: newVolume } = await supabase
        .from('volumes')
        .insert({
          novel_id: novelId,
          year: entryYear,
          volume_number: (volumeCount || 0) + 1,
          title: `Volume ${(volumeCount || 0) + 1}`,
        })
        .select()
        .single()

      volume = newVolume
    }

    // Fetch recent chapters for continuity
    const { data: recentChapters } = await supabase
      .from('chapters')
      .select('title, content, mood, chapter_number')
      .eq('novel_id', novelId)
      .order('chapter_number', { ascending: false })
      .limit(3)

    // Build prompt and generate
    const { system, user: userPrompt } = buildChapterPrompt(
      novel,
      rawEntry,
      entryDate,
      finalChapterNumber,
      volume?.volume_number || 1,
      entryYear,
      recentChapters || []
    )

    const result = await generateChapter(system, userPrompt)

    // Save chapter
    let savedChapter

    if (chapterId) {
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .update({
          title: result.title,
          content: result.content,
          raw_entry: rawEntry,
          entry_date: entryDate,
          mood: result.mood,
          mood_score: result.mood_score,
          tags: result.tags,
          opening_quote: result.opening_quote,
          soundtrack_suggestion: result.soundtrack
            ? `${result.soundtrack.song} by ${result.soundtrack.artist}`
            : null,
          word_count: result.content.split(/\s+/).length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapterId)
        .eq('novel_id', novelId)
        .select()
        .single()

      if (chapterError) {
        return NextResponse.json({ error: chapterError.message }, { status: 500 })
      }
      savedChapter = chapter
    } else {
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          novel_id: novelId,
          volume_id: volume?.id || null,
          chapter_number: finalChapterNumber,
          title: result.title,
          content: result.content,
          raw_entry: rawEntry,
          entry_mode: 'freeform',
          entry_date: entryDate,
          mood: result.mood,
          mood_score: result.mood_score,
          tags: result.tags,
          opening_quote: result.opening_quote,
          soundtrack_suggestion: result.soundtrack
            ? `${result.soundtrack.song} by ${result.soundtrack.artist}`
            : null,
          word_count: result.content.split(/\s+/).length,
        })
        .select()
        .single()

      if (chapterError) {
        return NextResponse.json({ error: chapterError.message }, { status: 500 })
      }
      savedChapter = chapter
    }

    // Update novel's updated_at
    await supabase
      .from('novels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', novelId)

    return NextResponse.json({ chapterId: savedChapter.id })
  } catch (error: unknown) {
    console.error('Chapter generation error:', error)
    return NextResponse.json({ error: 'Failed to generate chapter' }, { status: 500 })
  }
}

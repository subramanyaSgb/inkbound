import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 5 requests per minute per user
    const { allowed } = checkRateLimit(`generate:${user.id}`, 5, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { novelId, rawEntry, entryDate, chapterId, editInstruction } = await request.json()

    // Quick edit mode: editInstruction + chapterId, no rawEntry needed
    const isQuickEdit = !!editInstruction?.trim() && !!chapterId

    if (!novelId || (!isQuickEdit && (!rawEntry?.trim() || !entryDate))) {
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

    // --- EDIT MODE: update existing chapter to 'generating' ---
    if (chapterId) {
      const { data: existingChapter } = await supabase
        .from('chapters')
        .select('chapter_number, raw_entry, entry_date')
        .eq('id', chapterId)
        .single()

      if (!existingChapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      }

      // Set status to generating, clear AI-generated content
      await supabase
        .from('chapters')
        .update({
          status: 'generating',
          raw_entry: isQuickEdit ? existingChapter.raw_entry : rawEntry,
          entry_date: isQuickEdit ? existingChapter.entry_date : entryDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapterId)

      return NextResponse.json({ chapterId, status: 'generating' })
    }

    // --- NEW CHAPTER: insert with 'generating' status ---

    // Get chapter count for chapter number (exclude deleted)
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId)
      .is('deleted_at', null)

    const chapterNumber = (chapterCount || 0) + 1

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

    // Insert chapter row with 'generating' status (no AI content yet)
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .insert({
        novel_id: novelId,
        volume_id: volume?.id || null,
        chapter_number: chapterNumber,
        title: null,
        content: null,
        raw_entry: rawEntry,
        entry_mode: 'freeform',
        entry_date: entryDate,
        status: 'generating',
        mood: null,
        mood_score: null,
        tags: [],
        opening_quote: null,
        word_count: 0,
      })
      .select()
      .single()

    if (chapterError) {
      return NextResponse.json({ error: chapterError.message }, { status: 500 })
    }

    // Update novel's updated_at
    await supabase
      .from('novels')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', novelId)

    return NextResponse.json({ chapterId: chapter.id, status: 'generating' })
  } catch (error: unknown) {
    console.error('Chapter generation error:', error)
    return NextResponse.json({ error: 'Failed to start chapter generation' }, { status: 500 })
  }
}

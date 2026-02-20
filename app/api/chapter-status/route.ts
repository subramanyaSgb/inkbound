import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('id')
    const novelId = searchParams.get('novelId')

    // Single chapter status check (used by write page polling)
    if (chapterId) {
      const { data: chapter } = await supabase
        .from('chapters')
        .select('id, status, created_at')
        .eq('id', chapterId)
        .single()

      if (!chapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
      }

      return NextResponse.json({
        chapterId: chapter.id,
        status: chapter.status,
        createdAt: chapter.created_at,
      })
    }

    // Batch status check for a novel (used by novel page polling)
    if (novelId) {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, status, created_at')
        .eq('novel_id', novelId)
        .in('status', ['generating', 'failed'])
        .is('deleted_at', null)

      return NextResponse.json({ chapters: chapters || [] })
    }

    return NextResponse.json({ error: 'Provide id or novelId parameter' }, { status: 400 })
  } catch (error) {
    console.error('Chapter status error:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}

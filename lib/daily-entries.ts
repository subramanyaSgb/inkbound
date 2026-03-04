import { SupabaseClient } from '@supabase/supabase-js'
import type { DailyEntry } from '@/types'

/** Upsert an entry for a given novel + date. Creates if new, updates if exists. */
export async function saveEntry(
  supabase: SupabaseClient,
  params: {
    novelId: string
    userId: string
    content: string
    entryDate: string
    entryMode?: string
    isAutoSave?: boolean
  }
): Promise<DailyEntry | null> {
  const wordCount = params.content.trim().split(/\s+/).filter(Boolean).length

  const date = new Date(params.entryDate + 'T00:00:00')
  const title = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' Entry'

  const { data, error } = await supabase
    .from('daily_entries')
    .upsert(
      {
        novel_id: params.novelId,
        user_id: params.userId,
        content: params.content,
        entry_date: params.entryDate,
        entry_mode: params.entryMode || 'freeform',
        title,
        word_count: wordCount,
        ...(params.isAutoSave && { last_auto_saved_at: new Date().toISOString() }),
      },
      { onConflict: 'novel_id,entry_date' }
    )
    .select()
    .single()

  if (error) {
    console.error('Failed to save entry:', error)
    return null
  }
  return data as DailyEntry
}

/** Fetch a single entry by novel + date */
export async function getEntryByDate(
  supabase: SupabaseClient,
  novelId: string,
  entryDate: string
): Promise<DailyEntry | null> {
  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('novel_id', novelId)
    .eq('entry_date', entryDate)
    .single()

  return (data as DailyEntry) || null
}

/** Fetch recent draft entries for a novel (for the write page sidebar) */
export async function getRecentDraftEntries(
  supabase: SupabaseClient,
  novelId: string,
  limit = 7
): Promise<DailyEntry[]> {
  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('novel_id', novelId)
    .eq('status', 'draft')
    .order('entry_date', { ascending: false })
    .limit(limit)

  return (data as DailyEntry[]) || []
}

/** Fetch all entries for a novel (for the entries page) */
export async function getEntriesForNovel(
  supabase: SupabaseClient,
  novelId: string,
  status?: 'draft' | 'archived'
): Promise<DailyEntry[]> {
  let query = supabase
    .from('daily_entries')
    .select('*')
    .eq('novel_id', novelId)
    .order('entry_date', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data } = await query
  return (data as DailyEntry[]) || []
}

/** Fetch all entries for a user across all novels (for the main entries page) */
export async function getAllEntries(
  supabase: SupabaseClient,
  userId: string,
  filters?: { status?: 'draft' | 'archived'; novelId?: string }
): Promise<DailyEntry[]> {
  let query = supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.novelId) query = query.eq('novel_id', filters.novelId)

  const { data } = await query
  return (data as DailyEntry[]) || []
}

/** Fetch entries by IDs (for generation) */
export async function getEntriesByIds(
  supabase: SupabaseClient,
  entryIds: string[]
): Promise<DailyEntry[]> {
  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .in('id', entryIds)
    .order('entry_date', { ascending: true })

  return (data as DailyEntry[]) || []
}

/** Archive entries after chapter generation */
export async function archiveEntries(
  supabase: SupabaseClient,
  entryIds: string[],
  chapterId: string
): Promise<void> {
  await supabase
    .from('daily_entries')
    .update({ status: 'archived', chapter_id: chapterId })
    .in('id', entryIds)
}

/** Delete an entry */
export async function deleteEntry(
  supabase: SupabaseClient,
  entryId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('daily_entries')
    .delete()
    .eq('id', entryId)

  return !error
}

/** Calculate writing streak for a user */
export async function getWritingStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<{ current: number; longest: number }> {
  const { data } = await supabase
    .from('daily_entries')
    .select('entry_date')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })

  if (!data || data.length === 0) return { current: 0, longest: 0 }

  const dates = data.map(d => d.entry_date).sort().reverse()
  const today = new Date().toISOString().split('T')[0]

  let current = 0
  let longest = 0
  let streak = 1

  // Check if most recent entry is today or yesterday
  const mostRecent = dates[0]
  const diffFromToday = Math.floor(
    (new Date(today).getTime() - new Date(mostRecent).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffFromToday > 1) {
    current = 0
  } else {
    current = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        current++
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  streak = 1
  longest = 1
  const sortedAsc = [...dates].reverse()
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1])
    const curr = new Date(sortedAsc[i])
    const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      streak++
      longest = Math.max(longest, streak)
    } else {
      streak = 1
    }
  }

  return { current, longest }
}

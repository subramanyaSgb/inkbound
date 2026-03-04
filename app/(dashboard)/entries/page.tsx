import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntriesPageClient } from '@/components/entries/EntriesPageClient'

export default async function EntriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: novels } = await supabase
    .from('novels')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })

  return (
    <EntriesPageClient
      novels={novels || []}
      initialEntries={entries || []}
      userId={user.id}
    />
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { WritePageClient } from '@/components/write/WritePageClient'

export default async function WritePage({ searchParams }: { searchParams: { novelId?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let novels: { id: string; title: string }[] = []
  try {
    const { data } = await supabase
      .from('novels')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
    novels = data || []
  } catch {
    // If query fails, redirect home instead of crashing
    redirect('/')
  }

  if (novels.length === 0) {
    redirect('/novel/new')
  }

  // If only 1 novel, auto-select it. Otherwise require explicit selection.
  const novelId = searchParams.novelId || (novels.length === 1 ? novels[0].id : null)

  // Step 1: Novel selection (shown when multiple novels and none chosen yet)
  if (!novelId) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1 md:mb-2">Which novel are you writing for?</h1>
        <p className="text-sm md:text-base text-text-secondary mb-4 md:mb-6">Pick a novel to continue.</p>

        <div className="space-y-2">
          {novels.map((novel) => (
            <Link key={novel.id} href={`/write?novelId=${novel.id}`}>
              <Card hover variant="glass" className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/20 flex items-center justify-center">
                  <span className="font-display text-sm text-accent-primary">{novel.title.charAt(0)}</span>
                </div>
                <h3 className="font-ui font-medium text-text-primary">{novel.title}</h3>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Step 2: Write mode selection
  const selectedNovel = novels.find(n => n.id === novelId)

  return (
    <WritePageClient
      novelId={novelId}
      novels={novels}
      selectedNovel={selectedNovel}
    />
  )
}

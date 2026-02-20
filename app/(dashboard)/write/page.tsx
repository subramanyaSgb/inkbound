import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

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

  // Step 2: Write mode selection (shown after novel is chosen)
  const selectedNovel = novels.find(n => n.id === novelId)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1 md:mb-2">What happened today?</h1>

      {novels.length > 1 && (
        <p className="text-sm text-text-secondary mb-4 md:mb-6">
          Writing for <span className="text-accent-primary font-ui">{selectedNovel?.title}</span>
          {' '}&middot;{' '}
          <Link href="/write" className="text-text-muted hover:text-text-secondary underline underline-offset-2">
            change
          </Link>
        </p>
      )}

      {novels.length === 1 && (
        <p className="text-sm md:text-base text-text-secondary mb-4 md:mb-6">Start writing your entry.</p>
      )}

      <div className="space-y-3">
        <Link href={`/write/freeform?novelId=${novelId}`}>
          <Card hover variant="glass" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </div>
            <div>
              <h3 className="font-ui font-medium text-text-primary group-hover:text-accent-primary transition-colors">Free Write</h3>
              <p className="text-sm text-text-secondary">Dump your thoughts, AI turns it into prose</p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-ink-border/40" />
        <span className="text-xs font-ui text-text-muted uppercase tracking-wider">AI Mode</span>
        <div className="flex-1 h-px bg-ink-border/40" />
      </div>

      <div className="space-y-3">
        <Link href={`/write/conversation?novelId=${novelId}`}>
          <Card hover variant="glass" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div>
              <h3 className="font-ui font-medium text-text-primary group-hover:text-accent-primary transition-colors">AI Conversation</h3>
              <p className="text-sm text-text-secondary">Answer guided questions one by one</p>
            </div>
          </Card>
        </Link>

        <Link href={`/write/structured?novelId=${novelId}`}>
          <Card hover variant="glass" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 border border-accent-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <div>
              <h3 className="font-ui font-medium text-text-primary group-hover:text-accent-primary transition-colors">Structured Prompts</h3>
              <p className="text-sm text-text-secondary">Fill in card-based sections at your own pace</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

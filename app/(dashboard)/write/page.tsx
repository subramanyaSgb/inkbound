import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default async function WritePage({ searchParams }: { searchParams: { novelId?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: novels } = await supabase
    .from('novels')
    .select('id, title')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (!novels || novels.length === 0) {
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
              <Card hover className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center">
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
        <p className="text-sm md:text-base text-text-secondary mb-4 md:mb-6">Choose how you want to write.</p>
      )}

      <Link href={`/write/freeform?novelId=${novelId}`}>
        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center text-xl">
            &gt;
          </div>
          <div>
            <h3 className="font-ui font-medium text-text-primary">Free Write</h3>
            <p className="text-sm text-text-secondary">Dump your thoughts, AI turns it into prose</p>
          </div>
        </Card>
      </Link>

      <Link href={`/write/guided?novelId=${novelId}`} className="block mt-3">
        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-ink-surface border border-ink-border flex items-center justify-center text-xl">
            ?
          </div>
          <div>
            <h3 className="font-ui font-medium text-text-primary">Guided Chat</h3>
            <p className="text-sm text-text-secondary">AI interviews you about your day</p>
          </div>
        </Card>
      </Link>
    </div>
  )
}

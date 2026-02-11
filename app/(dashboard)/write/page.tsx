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

  const novelId = searchParams.novelId || novels[0].id

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1 md:mb-2">What happened today?</h1>
      <p className="text-sm md:text-base text-text-secondary mb-4 md:mb-8">Select your novel and start writing.</p>

      {novels.length > 1 && (
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-ui text-text-secondary mb-2">Writing for:</label>
          <div className="flex flex-wrap gap-2">
            {novels.map((novel) => (
              <Link
                key={novel.id}
                href={`/write?novelId=${novel.id}`}
                className={`px-4 py-2 rounded-lg border text-sm font-ui transition-all ${novel.id === novelId ? 'border-accent-primary bg-ink-highlight text-accent-primary' : 'border-ink-border text-text-secondary hover:border-text-muted'}`}
              >
                {novel.title}
              </Link>
            ))}
          </div>
        </div>
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

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TarotCard } from '@/components/novel/TarotCard'
import type { StoryProfile } from '@/types'

export default async function CharactersPage({ params }: { params: { novelId: string } }) {
  const supabase = await createClient()
  const { novelId } = params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [novelResult, profilesResult] = await Promise.all([
    supabase.from('novels').select('title').eq('id', novelId).single(),
    supabase
      .from('story_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('mention_count', { ascending: false }),
  ])

  if (!novelResult.data) notFound()

  const profiles: StoryProfile[] = profilesResult.data || []
  const characters = profiles.filter(p => p.type === 'character')
  const locations = profiles.filter(p => p.type === 'location')
  const personal = profiles.filter(p => p.type === 'personal')

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </Link>
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1">Characters</h1>
      <p className="text-sm text-text-muted mb-6">{profiles.length} profile{profiles.length !== 1 ? 's' : ''} in {novelResult.data.title}</p>

      {profiles.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-lg text-text-secondary mb-2">No characters yet</p>
          <p className="text-sm text-text-muted">Add characters in <Link href="/settings" className="text-accent-primary hover:text-accent-primary/80">Settings</Link> to see them here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {personal.length > 0 && (
            <section>
              <h2 className="font-display text-base text-text-secondary mb-3">Protagonist</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {personal.map((p, i) => <TarotCard key={p.id} profile={p} novelId={novelId} index={i} />)}
              </div>
            </section>
          )}

          {characters.length > 0 && (
            <section>
              <h2 className="font-display text-base text-text-secondary mb-3">Characters</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {characters.map((p, i) => <TarotCard key={p.id} profile={p} novelId={novelId} index={i} />)}
              </div>
            </section>
          )}

          {locations.length > 0 && (
            <section>
              <h2 className="font-display text-base text-text-secondary mb-3">Locations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {locations.map((p, i) => <TarotCard key={p.id} profile={p} novelId={novelId} index={i} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

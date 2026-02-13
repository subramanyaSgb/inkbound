import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { QuoteCard } from '@/components/novel/QuoteCard'

export default async function QuotesPage({ params }: { params: { novelId: string } }) {
  const supabase = await createClient()
  const { novelId } = params

  const [novelResult, chaptersResult, savedResult] = await Promise.all([
    supabase.from('novels').select('title').eq('id', novelId).single(),
    supabase
      .from('chapters')
      .select('id, chapter_number, title, opening_quote, mood, entry_date')
      .eq('novel_id', novelId)
      .is('deleted_at', null)
      .not('opening_quote', 'is', null)
      .order('chapter_number', { ascending: false }),
    supabase
      .from('saved_quotes')
      .select('id, chapter_id, text, created_at')
      .eq('novel_id', novelId)
      .order('created_at', { ascending: false }),
  ])

  if (!novelResult.data) notFound()

  const chapters = chaptersResult.data || []
  const savedQuotes = savedResult.data || []
  const savedChapterIds = new Set(savedQuotes.map(q => q.chapter_id))

  const allQuotes = [
    ...chapters.map(ch => ({
      text: ch.opening_quote!,
      chapterTitle: ch.title,
      chapterNumber: ch.chapter_number,
      chapterId: ch.id,
      mood: ch.mood,
      entryDate: ch.entry_date,
      isSaved: savedChapterIds.has(ch.id),
      source: 'opening' as const,
    })),
    ...savedQuotes.map(sq => {
      const ch = chapters.find(c => c.id === sq.chapter_id)
      return {
        text: sq.text,
        chapterTitle: ch?.title || null,
        chapterNumber: ch?.chapter_number || 0,
        chapterId: sq.chapter_id,
        mood: ch?.mood || null,
        entryDate: ch?.entry_date || sq.created_at,
        isSaved: true,
        source: 'saved' as const,
      }
    }),
  ]

  const seen = new Set<string>()
  const uniqueQuotes = allQuotes.filter(q => {
    const key = `${q.chapterId}:${q.text.slice(0, 50)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={`/novel/${novelId}`} className="text-sm text-text-muted hover:text-text-secondary mb-4 inline-flex items-center gap-1 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </Link>
      <h1 className="font-display text-xl md:text-3xl text-text-primary mb-1">Quote Wall</h1>
      <p className="text-sm text-text-muted mb-6">{uniqueQuotes.length} quote{uniqueQuotes.length !== 1 ? 's' : ''} from {novelResult.data.title}</p>

      {uniqueQuotes.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-lg text-text-secondary mb-2">No quotes yet</p>
          <p className="text-sm text-text-muted">Write your first chapter to see its opening quote here.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-3">
          {uniqueQuotes.map((quote, i) => (
            <QuoteCard
              key={`${quote.chapterId}-${quote.source}-${i}`}
              quote={quote.text}
              chapterTitle={quote.chapterTitle}
              chapterNumber={quote.chapterNumber}
              chapterId={quote.chapterId}
              novelId={novelId}
              mood={quote.mood}
              entryDate={quote.entryDate}
              isSaved={quote.isSaved}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { Card } from '@/components/ui/Card'
import Link from 'next/link'

interface WordStatsProps {
  totalChapters: number
  totalWords: number
  avgWords: number
  longestChapter: { id: string; novel_id: string; word_count: number; title: string | null } | null
}

export function WordStats({ totalChapters, totalWords, avgWords, longestChapter }: WordStatsProps) {
  const stats = [
    { label: 'Chapters', value: totalChapters },
    { label: 'Total Words', value: totalWords.toLocaleString() },
    { label: 'Avg / Chapter', value: avgWords.toLocaleString() },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(s => (
        <Card key={s.label} className="text-center">
          <p className="font-display text-xl md:text-2xl text-text-primary">{s.value}</p>
          <p className="text-xs text-text-muted font-ui mt-1">{s.label}</p>
        </Card>
      ))}
      {longestChapter && (
        <Link href={`/novel/${longestChapter.novel_id}/chapter/${longestChapter.id}`}>
          <Card hover className="text-center h-full flex flex-col justify-center">
            <p className="font-display text-xl md:text-2xl text-text-primary">{longestChapter.word_count.toLocaleString()}</p>
            <p className="text-xs text-text-muted font-ui mt-1">Longest</p>
          </Card>
        </Link>
      )}
    </div>
  )
}

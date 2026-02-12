'use client'

import { motion } from 'framer-motion'
import { BookOpen, FileText, BarChart3, Award } from 'lucide-react'
import Link from 'next/link'

interface WordStatsProps {
  totalChapters: number
  totalWords: number
  avgWords: number
  longestChapter: { id: string; novel_id: string; word_count: number; title: string | null } | null
}

export function WordStats({ totalChapters, totalWords, avgWords, longestChapter }: WordStatsProps) {
  const stats = [
    { label: 'Chapters', value: totalChapters, Icon: BookOpen },
    { label: 'Total Words', value: totalWords.toLocaleString(), Icon: FileText },
    { label: 'Avg / Chapter', value: avgWords.toLocaleString(), Icon: BarChart3 },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <s.Icon className="w-4 h-4 text-accent-primary/60 mx-auto mb-2" />
          <p className="font-display text-xl md:text-2xl text-text-primary">{s.value}</p>
          <p className="text-xs text-text-muted font-ui mt-1">{s.label}</p>
        </motion.div>
      ))}
      {longestChapter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link href={`/novel/${longestChapter.novel_id}/chapter/${longestChapter.id}`}>
            <div className="glass-card glow-border rounded-xl p-4 text-center h-full flex flex-col justify-center hover:shadow-glow-sm transition-all cursor-pointer">
              <Award className="w-4 h-4 text-accent-primary/60 mx-auto mb-2" />
              <p className="font-display text-xl md:text-2xl text-text-primary">{longestChapter.word_count.toLocaleString()}</p>
              <p className="text-xs text-text-muted font-ui mt-1">Longest</p>
            </div>
          </Link>
        </motion.div>
      )}
    </div>
  )
}

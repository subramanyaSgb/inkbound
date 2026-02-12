import { Hash } from 'lucide-react'
import type { TagCount } from '@/lib/stats'

interface TagCloudProps {
  tags: TagCount[]
}

export function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-accent-primary/60" />
          Tags
        </h3>
        <p className="text-sm text-text-muted text-center py-4">No tags yet.</p>
      </div>
    )
  }

  const maxCount = tags[0].count
  const colors = ['text-accent-primary', 'text-text-primary', 'text-text-secondary', 'text-text-muted']

  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4 flex items-center gap-2">
        <Hash className="w-4 h-4 text-accent-primary/60" />
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 30).map((t) => {
          const ratio = t.count / maxCount
          const sizeClass = ratio > 0.7 ? 'text-lg' : ratio > 0.4 ? 'text-base' : 'text-sm'
          const colorClass = colors[Math.min(Math.floor((1 - ratio) * colors.length), colors.length - 1)]
          return (
            <span
              key={t.tag}
              className={`${sizeClass} ${colorClass} font-body cursor-default transition-colors hover:text-accent-primary`}
              title={`${t.count} mentions`}
            >
              #{t.tag}
            </span>
          )
        })}
      </div>
    </div>
  )
}

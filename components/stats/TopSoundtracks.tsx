import { Music } from 'lucide-react'
import type { SoundtrackCount } from '@/lib/stats'

interface TopSoundtracksProps {
  soundtracks: SoundtrackCount[]
}

export function TopSoundtracks({ soundtracks }: TopSoundtracksProps) {
  if (soundtracks.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4 flex items-center gap-2">
          <Music className="w-4 h-4 text-accent-primary/60" />
          Top Soundtracks
        </h3>
        <p className="text-sm text-text-muted text-center py-4">No soundtracks yet.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4 flex items-center gap-2">
        <Music className="w-4 h-4 text-accent-primary/60" />
        Top Soundtracks
      </h3>
      <div className="space-y-2">
        {soundtracks.map((s, i) => (
          <div key={`${s.song}-${s.artist}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-surface/40 transition-colors">
            <span className="text-xs font-ui text-text-muted w-5 text-right">{i + 1}</span>
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
              <Music className="w-3.5 h-3.5 text-accent-primary/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{s.song}</p>
              <p className="text-xs text-text-muted">{s.artist}</p>
            </div>
            <span className="text-xs text-text-muted font-ui bg-ink-surface/50 px-2 py-0.5 rounded-full">{s.count}x</span>
          </div>
        ))}
      </div>
    </div>
  )
}

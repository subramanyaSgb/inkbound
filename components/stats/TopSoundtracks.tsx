import type { SoundtrackCount } from '@/lib/stats'

interface TopSoundtracksProps {
  soundtracks: SoundtrackCount[]
}

export function TopSoundtracks({ soundtracks }: TopSoundtracksProps) {
  if (soundtracks.length === 0) {
    return (
      <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
        <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Top Soundtracks</h3>
        <p className="text-sm text-text-muted text-center py-4">No soundtracks yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-ink-card border border-ink-border p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg text-text-primary mb-4">Top Soundtracks</h3>
      <div className="space-y-2">
        {soundtracks.map((s, i) => (
          <div key={`${s.song}-${s.artist}`} className="flex items-center gap-3">
            <span className="text-xs font-ui text-text-muted w-5 text-right">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{s.song}</p>
              <p className="text-xs text-text-muted">{s.artist}</p>
            </div>
            <span className="text-xs text-text-muted font-ui">{s.count}x</span>
          </div>
        ))}
      </div>
    </div>
  )
}

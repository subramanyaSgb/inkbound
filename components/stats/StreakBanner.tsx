import { Card } from '@/components/ui/Card'

interface StreakBannerProps {
  current: number
  longest: number
  total: number
}

export function StreakBanner({ current, longest, total }: StreakBannerProps) {
  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl md:text-3xl">{current > 0 ? '/' : '.'}</span>
        <div>
          <p className="font-display text-2xl md:text-3xl text-accent-primary">{current}</p>
          <p className="text-xs text-text-muted font-ui">day streak</p>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="text-center">
          <p className="font-display text-lg text-text-primary">{longest}</p>
          <p className="text-xs text-text-muted font-ui">best</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg text-text-primary">{total}</p>
          <p className="text-xs text-text-muted font-ui">entries</p>
        </div>
      </div>
    </Card>
  )
}

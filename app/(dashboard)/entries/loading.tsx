import { Skeleton } from '@/components/ui/Skeleton'

export default function EntriesLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-10 w-full mb-6" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    </div>
  )
}

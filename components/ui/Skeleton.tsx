interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'card' | 'image'
}

const variantClasses = {
  text: 'h-4 rounded-md',
  circle: 'rounded-full aspect-square',
  card: 'rounded-xl h-32',
  image: 'rounded-lg aspect-[3/4]',
}

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={`
        ${variantClasses[variant]}
        bg-gradient-to-r from-ink-surface via-ink-card to-ink-surface bg-[length:200%_100%] animate-shimmer
        ${className}
      `}
    />
  )
}

import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-xl bg-ink-card border border-ink-border p-6
        ${hover ? 'transition-all duration-200 hover:border-accent-primary/30 hover:shadow-lg hover:shadow-accent-primary/5 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

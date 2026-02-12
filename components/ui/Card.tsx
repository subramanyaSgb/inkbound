'use client'

import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  variant?: 'default' | 'glass' | 'gradient'
  compact?: boolean
}

const variantClasses = {
  default: 'bg-ink-card border border-ink-border',
  glass: 'glass-card',
  gradient: 'bg-ink-card border border-ink-border glow-border',
}

export function Card({ hover = false, variant = 'default', compact = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-xl ${compact ? 'p-3' : 'p-4 md:p-6'}
        ${variantClasses[variant]}
        ${hover ? 'transition-all duration-300 hover:border-accent-primary/30 hover:shadow-glow-sm hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

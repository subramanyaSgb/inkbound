'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glow'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

const variants = {
  primary: 'bg-accent-primary text-ink-bg hover:bg-accent-primary/90 shadow-sm',
  secondary: 'bg-ink-card text-text-primary border border-ink-border hover:bg-ink-surface hover:border-accent-primary/30',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-ink-surface/80',
  danger: 'bg-status-error/90 text-white hover:bg-status-error',
  outline: 'border border-accent-primary/40 text-accent-primary hover:bg-accent-primary/10 hover:border-accent-primary/60',
  glow: 'bg-accent-primary text-ink-bg hover:bg-accent-primary/90 shadow-glow-md hover:shadow-glow-lg',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs md:text-sm',
  md: 'px-3 py-2 text-sm md:px-4 md:text-base',
  lg: 'px-4 py-2.5 text-base md:px-6 md:py-3 md:text-lg',
  icon: 'p-2 aspect-square',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className = '', children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`
          inline-flex items-center justify-center rounded-lg font-ui font-medium
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

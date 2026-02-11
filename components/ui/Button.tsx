'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const variants = {
  primary: 'bg-accent-primary text-ink-bg hover:bg-accent-primary/90',
  secondary: 'bg-ink-card text-text-primary border border-ink-border hover:bg-ink-surface',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-ink-surface',
  danger: 'bg-status-error text-white hover:bg-status-error/90',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs md:text-sm',
  md: 'px-3 py-2 text-sm md:px-4 md:text-base',
  lg: 'px-4 py-2.5 text-base md:px-6 md:py-3 md:text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className = '', children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={`
          inline-flex items-center justify-center rounded-lg font-ui font-medium
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
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

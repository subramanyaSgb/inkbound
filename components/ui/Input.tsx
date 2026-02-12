'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-ui transition-colors duration-200 ${
              focused ? 'text-accent-primary' : 'text-text-secondary'
            }`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            className={`
              w-full rounded-lg border bg-ink-surface/80 px-3 py-2 md:px-4 md:py-2.5 font-ui text-text-primary
              placeholder:text-text-muted/60
              transition-all duration-200
              focus:outline-none focus:bg-ink-glass focus:backdrop-blur-sm focus:border-accent-primary/50 focus:shadow-glow-sm
              ${error ? 'border-status-error' : 'border-ink-border hover:border-ink-border/80'}
              ${className}
            `}
            {...props}
          />
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-status-error" />
          )}
        </div>
        {error && (
          <p className="text-sm text-status-error flex items-center gap-1">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

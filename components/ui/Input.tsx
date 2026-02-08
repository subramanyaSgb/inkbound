import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-ui text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-lg border bg-ink-surface px-4 py-2.5 font-ui text-text-primary
            placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
            ${error ? 'border-status-error' : 'border-ink-border'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-status-error">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-3">
          Something went wrong
        </h2>
        <p className="text-text-muted mb-8 text-sm leading-relaxed">
          An unexpected error occurred. You can try again or head back to your library.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="secondary" className="w-full sm:w-auto">
              Go to Library
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

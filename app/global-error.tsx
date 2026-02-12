'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#09090B',
          color: '#FFFFFF',
          fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: '#71717A',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            A critical error occurred. Please try again or refresh the page.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#C9A84C',
                color: '#09090B',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                color: '#C9A84C',
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
              }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Go to Library
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}

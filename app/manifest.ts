import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inkbound',
    short_name: 'Inkbound',
    description: 'Your life, bound in ink.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0B0E',
    theme_color: '#0D0B0E',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}

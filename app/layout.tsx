import type { Metadata, Viewport } from "next";
import { Playfair_Display, Crimson_Pro, DM_Sans, JetBrains_Mono } from 'next/font/google'
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const crimson = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Inkbound — Your Life, Bound in Ink',
    template: '%s | Inkbound',
  },
  description: 'An AI-powered life journal that transforms your daily experiences into an evolving novel.',
  keywords: ['journal', 'AI writing', 'novel', 'life story', 'diary'],
  authors: [{ name: 'Inkbound' }],
  openGraph: {
    title: 'Inkbound — Your Life, Bound in Ink',
    description: 'An AI-powered life journal that transforms your daily experiences into an evolving novel.',
    siteName: 'Inkbound',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inkbound — Your Life, Bound in Ink',
    description: 'An AI-powered life journal that transforms your daily experiences into an evolving novel.',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    statusBarStyle: 'black-translucent',
    title: 'Inkbound',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D0B0E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-ink-bg text-text-primary font-ui antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.democracyunlocked.com'),
  title: {
    default: 'Democracy Unlocked',
    template: '%s | Democracy Unlocked',
  },
  description:
    'Read real legislation, cast your vote, and see how your views compare to Congress — ' +
    'powered by AI and official data from Congress.gov.',
  applicationName: 'Democracy Unlocked',
  // iOS PWA support — pairs with the web app manifest at app/manifest.ts to
  // make "Add to Home Screen" launch the site as a standalone app
  appleWebApp: {
    capable: true,
    // 'default' shows the iOS status bar on top of the app content with its
    // own background — works well for our light dashboard.
    statusBarStyle: 'default',
    title: 'Democracy',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Democracy Unlocked',
    description: 'Vote on real legislation. Compare your views to Congress. Powered by AI.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Democracy Unlocked',
    description: 'Vote on real legislation. Compare your views to Congress. Powered by AI.',
  },
}

// Viewport config (themeColor moved here per Next.js 14+ convention).
// theme_color matches the manifest so mobile browser chrome / Android status
// bar follow the brand color.
export const viewport: Viewport = {
  themeColor: '#0A2463', // Old Glory navy
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}

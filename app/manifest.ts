import type { MetadataRoute } from 'next'

/**
 * Web App Manifest — powers "Add to Home Screen" / PWA install on Android,
 * Chrome desktop, and standards-compliant browsers. iOS uses parallel meta
 * tags wired up in app/layout.tsx (apple-mobile-web-app-*).
 *
 * Next.js auto-serves this as /manifest.webmanifest and injects the
 * <link rel="manifest"> tag — no manual wiring required.
 *
 * Re-test after changes with Chrome → DevTools → Application → Manifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Democracy Unlocked',
    short_name: 'Democracy',
    description:
      'Read real legislation, cast your vote, and see how your views compare ' +
      'to Congress — powered by AI and official data from Congress.gov.',
    // Returning installed-PWA users land on the dashboard, not the landing page
    start_url: '/dashboard',
    // 'standalone' hides browser chrome — the app looks like a native app
    display: 'standalone',
    orientation: 'portrait',
    // Splash background while the app boots (white matches the dashboard)
    background_color: '#FFFFFF',
    // Browser/status-bar color on Android — Old Glory navy
    theme_color: '#0A2463',
    categories: ['news', 'education', 'government', 'politics'],
    // Icons are added once logo assets are generated via scripts/prepare-logo.py.
    // Leaving this empty prevents 404s from the PWA manifest until then.
    icons: [],
  }
}

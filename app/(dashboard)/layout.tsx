import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PageTransition from '@/components/ui/PageTransition'
import NavBar from '@/components/ui/NavBar'
import Logo from '@/components/ui/Logo'
import CookieConsent from '@/components/legal/CookieConsent'
import NotificationBell from '@/components/ui/NotificationBell'
import CommandPalette from '@/components/ui/CommandPalette'
import SearchButton from '@/components/ui/SearchButton'
import MobileTabBar from '@/components/ui/MobileTabBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[--surface-secondary] flex flex-col">
      <nav className="sticky top-0 z-50 bg-[--surface] border-b border-[--border] shadow-sm">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center h-14 gap-3">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <Logo className="w-7 h-7 text-[--accent]" />
              <span className="font-display text-sm font-bold text-[--text] hidden sm:block">
                Democracy Unlocked<span className="align-super text-[8px] font-semibold ml-0.5">™</span>
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
                title="This site is in beta — expect rough edges and incomplete data while we keep building."
              >
                Beta
              </span>
            </Link>

            {/* Nav links — flex-1 so it's bounded between logo and avatar */}
            <NavBar />

            {/* Spacer on mobile (NavBar is hidden < md; tab bar handles nav) */}
            <div className="flex-1 md:hidden" />

            {/* Search + Notification bell + Avatar */}
            <div className="shrink-0 flex items-center gap-2">
              <SearchButton />
              <NotificationBell />
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: 'w-8 h-8' } }}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8 w-full">
        <Breadcrumbs />
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* ── Legal footer ── */}
      <footer className="border-t border-[--border] bg-[--surface] mt-12">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-col gap-3 text-xs text-[--text-muted]">
          <p className="text-center sm:text-left bg-amber-50 border border-amber-200 text-amber-800 rounded px-3 py-2">
            <strong className="font-semibold">Beta:</strong> Democracy Unlocked is under active development.
            Some data may be incomplete or out of date, and AI-generated summaries should be cross-checked against the original bill text before action.
            Found a bug or a wrong number? <Link href="/account/privacy" className="underline">Tell us</Link>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              &copy; {new Date().getFullYear()} Democracy Unlocked&trade;. Not affiliated with the U.S. Government. &ldquo;Democracy Unlocked&rdquo; and the Democracy Unlocked logo are trademarks of Democracy Unlocked.
            </p>
            <nav className="flex items-center gap-4 font-medium flex-wrap justify-center">
              <Link href="/about" className="hover:text-[--accent] transition-colors">About</Link>
              <Link href="/news" className="hover:text-[--accent] transition-colors">News</Link>
              <Link href="/elections" className="hover:text-[--accent] transition-colors">Elections</Link>
              <Link href="/privacy" className="hover:text-[--accent] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[--accent] transition-colors">Terms</Link>
              <Link href="/account/privacy" className="hover:text-[--accent] transition-colors">Your data</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* Global search palette (Cmd+K) + mobile bottom tabs */}
      <CommandPalette />
      <MobileTabBar />

      {/* GDPR cookie banner — renders only when the user hasn't decided yet */}
      <CookieConsent />
    </div>
  )
}

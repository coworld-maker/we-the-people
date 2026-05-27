import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PageTransition from '@/components/ui/PageTransition'
import NavBar from '@/components/ui/NavBar'
import Logo from '@/components/ui/Logo'
import CookieConsent from '@/components/legal/CookieConsent'

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
                Democracy Unlocked
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

            {/* Avatar */}
            <div className="shrink-0">
              <UserButton
                signOutFallbackRedirectUrl="/"
                appearance={{ elements: { avatarBox: 'w-8 h-8' } }}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full">
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
              &copy; {new Date().getFullYear()} Democracy Unlocked. Not affiliated with the U.S. Government.
            </p>
            <nav className="flex items-center gap-4 font-medium">
              <Link href="/privacy" className="hover:text-[--accent] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[--accent] transition-colors">Terms</Link>
              <Link href="/account/privacy" className="hover:text-[--accent] transition-colors">Your data</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* GDPR cookie banner — renders only when the user hasn't decided yet */}
      <CookieConsent />
    </div>
  )
}

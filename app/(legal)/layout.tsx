import Link from 'next/link'
import Logo from '@/components/ui/Logo'

/**
 * Shared layout for /privacy and /terms — minimal header, generous readable
 * column, footer with cross-links between the two documents.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--bg] text-[--text]">
      {/* Minimal header */}
      <header className="border-b border-[--border] bg-[--surface]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo className="w-7 h-7 text-[--accent]" variant="mark" />
            <span className="font-display text-sm font-bold text-[--text]">
              Democracy Unlocked
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-[--text-muted]">
            <Link href="/privacy" className="hover:text-[--accent] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[--accent] transition-colors">Terms</Link>
          </nav>
        </div>
      </header>

      {/* Article column */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}

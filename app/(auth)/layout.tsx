/**
 * Shared frame for /sign-up and /sign-in.
 *
 * The old pages rendered a bare Clerk card on a grey page: no brand, no
 * reason to create an account, and no way back to the site. Five people
 * reached /sign-up on the first day of Instagram posts and none finished.
 * This frame keeps the site's identity, says what an account is for, and
 * always leaves a way back to the public pages.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--surface-secondary] flex flex-col">
      <header className="px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-[44px] text-sm font-medium text-[--text-muted] hover:text-[--accent] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Democracy Unlocked
        </Link>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-10">
        {children}
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-[--text-muted]">
        <Link href="/privacy" className="hover:text-[--accent] underline-offset-2 hover:underline">Privacy</Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-[--accent] underline-offset-2 hover:underline">Terms</Link>
        <span className="mx-2">·</span>
        <Link href="/bills" className="hover:text-[--accent] underline-offset-2 hover:underline">Browse bills without an account</Link>
      </footer>
    </div>
  )
}

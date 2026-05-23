import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PageTransition from '@/components/ui/PageTransition'
import NavBar from '@/components/ui/NavBar'
import Logo from '@/components/ui/Logo'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[--surface-secondary]">
      <nav className="sticky top-0 z-50 bg-[--surface] border-b border-[--border] shadow-sm">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center h-14 gap-3">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <Logo className="w-7 h-7" />
              <span className="font-display text-sm font-bold text-[--text] hidden sm:block">
                Democracy Unlocked
              </span>
            </Link>

            {/* Nav links — flex-1 so it's bounded between logo and avatar */}
            <NavBar />

            {/* Avatar */}
            <div className="shrink-0">
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: 'w-8 h-8' } }}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <Breadcrumbs />
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  )
}

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Vote, LayoutDashboard, FileText } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[--surface-secondary]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[--border]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[--accent] rounded-lg flex items-center justify-center">
                <Vote className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-sm font-bold text-[--text] hidden sm:block">
                Democracy Unlocked
              </span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-0.5">
              <Link href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary] rounded-md transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/bills"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary] rounded-md transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Bills</span>
              </Link>
            </div>

            {/* User */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        {children}
      </main>
    </div>
  )
}

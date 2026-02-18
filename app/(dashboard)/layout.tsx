import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B6B] to-[#6366F1] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg">🗳️</span>
              </div>
              <span className="font-display text-lg font-extrabold text-[#0F172A] tracking-tight hidden sm:block">
                Democracy<span className="text-[#FF6B6B]">Unlocked</span>
              </span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-[#0F172A] hover:bg-gray-50 rounded-xl transition-colors font-body"
              >
                🏠 Dashboard
              </Link>
              <Link
                href="/bills"
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-[#0F172A] hover:bg-gray-50 rounded-xl transition-colors font-body"
              >
                📜 Bills
              </Link>
            </div>

            {/* User */}
            <div className="flex items-center gap-3">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 ring-2 ring-gray-100',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}

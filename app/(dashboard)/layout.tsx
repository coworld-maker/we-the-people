import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import {
  Vote, LayoutDashboard, FileText, Newspaper, Grid3X3, Info,
  Landmark, GraduationCap, BarChart3, ScrollText,
} from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PageTransition from '@/components/ui/PageTransition'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[--surface-secondary]">
      <nav className="sticky top-0 z-50 bg-white border-b border-[--border]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 bg-[--accent] rounded-lg flex items-center justify-center">
                <Vote className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-sm font-bold text-[--text] hidden sm:block">
                Democracy Unlocked
              </span>
            </Link>

            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
              <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavLink href="/bills" icon={FileText} label="Bills" />
              <NavLink href="/documents" icon={ScrollText} label="Documents" />
              <NavLink href="/policy-areas" icon={Grid3X3} label="Policy" />
              <NavLink href="/action-center" icon={Landmark} label="Action" />
              <NavLink href="/scorecards" icon={BarChart3} label="Scorecards" />
              <NavLink href="/learn" icon={GraduationCap} label="Learn" />
              <NavLink href="/transparency" icon={BarChart3} label="Stats" />
              <NavLink href="/news" icon={Newspaper} label="News" />
              <NavLink href="/about" icon={Info} label="About" />
            </div>

            <div className="shrink-0 ml-2">
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

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary] rounded-md transition-colors whitespace-nowrap"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  )
}

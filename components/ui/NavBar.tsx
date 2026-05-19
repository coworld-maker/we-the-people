'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Vote, LayoutDashboard, FileText, Newspaper, Grid3X3, Info,
  Landmark, GraduationCap, BarChart3, ScrollText, ClipboardList, Users,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/bills',            icon: FileText,        label: 'Bills' },
  { href: '/documents',        icon: ScrollText,      label: 'Documents' },
  { href: '/bills?groupBy=policy', icon: Grid3X3,     label: 'Policy' },
  { href: '/voting-records',   icon: ClipboardList,   label: 'Votes' },
  { href: '/my-representatives', icon: Users,         label: 'My Reps' },
  { href: '/action-center',    icon: Landmark,        label: 'Action' },
  { href: '/scorecards',       icon: BarChart3,       label: 'Scorecards' },
  { href: '/learn',            icon: GraduationCap,   label: 'Learn' },
  { href: '/transparency',     icon: BarChart3,       label: 'Stats' },
  { href: '/news',             icon: Newspaper,       label: 'News' },
  { href: '/about',            icon: Info,            label: 'About' },
]

export default function NavBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentGroupBy = searchParams.get('groupBy')

  return (
    <div className="flex-1 min-w-0 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
      {NAV_LINKS.map(({ href, icon: Icon, label }) => {
        // Split nav hrefs into pathname + query so /bills and /bills?groupBy=policy
        // each highlight only when their grouping mode matches the URL.
        const [hrefPath, hrefQuery] = href.split('?')
        const hrefGroupBy = hrefQuery ? new URLSearchParams(hrefQuery).get('groupBy') : null
        const pathMatches = pathname === hrefPath || (hrefPath !== '/dashboard' && pathname.startsWith(hrefPath))
        const groupByMatches = hrefGroupBy ? currentGroupBy === hrefGroupBy : true
        // For /bills specifically: only highlight the plain Bills link when
        // groupBy is not 'policy' (otherwise the Policy link wins)
        const isPlainBills = hrefPath === '/bills' && !hrefGroupBy
        const active = pathMatches && groupByMatches && (!isPlainBills || currentGroupBy !== 'policy')
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap
              ${active
                ? 'text-[--accent] bg-[--accent]/10'
                : 'text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary]'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        )
      })}
    </div>
  )
}

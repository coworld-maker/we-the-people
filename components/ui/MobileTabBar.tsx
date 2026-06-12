'use client'

/**
 * Mobile bottom tab bar — replaces the hamburger drawer on small viewports.
 * The four task sections stay visible and thumb-reachable on every page;
 * deeper pages are reached through the hubs, search, and cross-links.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Users, Megaphone } from 'lucide-react'

const TABS = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Home' },
  { href: '/bills',              icon: FileText,        label: 'Track' },
  { href: '/my-representatives', icon: Users,           label: 'Know' },
  { href: '/act',                icon: Megaphone,       label: 'Act' },
]

// Routes that belong to a tab's section, so the tab stays lit on deep pages
const SECTION_PREFIXES: Record<string, string[]> = {
  '/bills':              ['/bills', '/state-bills', '/policy-areas', '/documents'],
  '/my-representatives': ['/my-representatives', '/scorecards', '/voting-records', '/news', '/states'],
  '/act':                ['/act', '/action-center', '/get-started', '/learn', '/elections', '/transparency'],
}

export default function MobileTabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return (SECTION_PREFIXES[href] ?? [href]).some(p => pathname.startsWith(p))
  }

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[--surface] border-t border-[--border] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-4">
        {TABS.map(tab => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-[--accent] focus-visible:-outline-offset-2 ${
                active ? 'text-[--accent]' : 'text-[--text-muted]'
              }`}
            >
              {active && (
                <span className="absolute top-0 inset-x-6 h-[3px] rounded-b bg-[--accent]" aria-hidden="true" />
              )}
              <tab.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

/**
 * Mobile-only contextual sub-nav. The bottom tab bar only holds the four
 * sections (Home/Track/Know/Act); this restores reach to each section's
 * sub-pages (Scorecards, News, State bills, etc.) that the retired hamburger
 * used to expose. Shows a horizontal chip row for whichever section you're in.
 *
 * Keep the section lists in sync with NAV_ITEMS in NavBar.tsx.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/track'

interface SubLink { href: string; label: string }

const SECTIONS: { match: string[]; items: SubLink[] }[] = [
  {
    // Track
    match: ['/bills', '/state-bills', '/policy-areas', '/documents'],
    items: [
      { href: '/bills', label: 'Federal Bills' },
      { href: '/state-bills', label: 'State' },
      { href: '/policy-areas', label: 'Policy Areas' },
      { href: '/documents', label: 'Documents' },
    ],
  },
  {
    // Know
    match: ['/my-representatives', '/scorecards', '/voting-records', '/news', '/states'],
    items: [
      { href: '/my-representatives', label: 'My Reps' },
      { href: '/scorecards', label: 'Scorecards' },
      { href: '/news', label: 'News' },
    ],
  },
  {
    // Act
    match: ['/act', '/action-center', '/get-started', '/learn', '/elections', '/transparency'],
    items: [
      { href: '/act', label: 'Overview' },
      { href: '/action-center', label: 'Contact Reps' },
      { href: '/get-started', label: 'Get Started' },
      { href: '/learn', label: 'Learn' },
      { href: '/elections', label: 'Elections' },
      { href: '/transparency', label: 'Stats' },
    ],
  },
]

function isActive(pathname: string, href: string) {
  const path = href.split('?')[0]
  return pathname === path || pathname.startsWith(path + '/')
}

export default function MobileSectionNav() {
  const pathname = usePathname()
  const section = SECTIONS.find(s => s.match.some(p => pathname === p || pathname.startsWith(p + '/')))
  if (!section || section.items.length < 2) return null

  return (
    <nav
      aria-label="Section"
      className="md:hidden sticky top-14 z-40 -mx-5 px-4 py-2 bg-[--surface]/95 backdrop-blur border-b border-[--border] overflow-x-auto"
    >
      <div className="flex items-center gap-2 w-max">
        {section.items.map(item => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => track('nav_click', { label: item.label, href: item.href, surface: 'mobile_subnav' })}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                active
                  ? 'bg-[--accent] text-white border-[--accent]'
                  : 'border-[--border] text-[--text-secondary] bg-[--surface]'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

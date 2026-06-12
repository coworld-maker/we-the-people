'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  LayoutDashboard, FileText, ScrollText, Grid3X3,
  Users, BarChart3, ClipboardList,
  Landmark, Newspaper, Megaphone, GraduationCap,
} from 'lucide-react'

// ── Nav structure ────────────────────────────────────────────────────────────
// Task-based IA (Track/Know/Act, Jun 2026 — see docs/passdowns/2026-06-12-nav-overhaul.md):
// four sections named for what the user is doing, not what the database stores.
// "Act" is a real hub page, not a dropdown — nothing hidden behind hover.
// Mobile gets a bottom tab bar (MobileTabBar.tsx) instead of a hamburger.

interface NavLink { href: string; icon: any; label: string }
interface NavGroup { label: string; icon: any; description: string; items: NavLink[] }
type NavItem =
  | ({ kind: 'link' } & NavLink)
  | ({ kind: 'group' } & NavGroup)

const NAV_ITEMS: NavItem[] = [
  { kind: 'link', href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  {
    kind: 'group', label: 'Track', icon: FileText,
    description: 'Follow legislation that affects you',
    items: [
      { href: '/bills',        icon: FileText,   label: 'Federal Bills' },
      { href: '/state-bills',  icon: Landmark,   label: 'State Legislature' },
      { href: '/policy-areas', icon: Grid3X3,    label: 'Policy Areas' },
      { href: '/documents',    icon: ScrollText, label: 'Documents' },
    ],
  },
  {
    kind: 'group', label: 'Know', icon: Users,
    description: 'Understand who represents you',
    items: [
      { href: '/my-representatives', icon: Users,         label: 'My Reps' },
      { href: '/scorecards',         icon: BarChart3,     label: 'Scorecards' },
      { href: '/voting-records',     icon: ClipboardList, label: 'Voting Records' },
      { href: '/news',               icon: Newspaper,     label: 'News' },
    ],
  },
  { kind: 'link', href: '/act', icon: Megaphone, label: 'Act' },
  { kind: 'link', href: '/get-started', icon: GraduationCap, label: 'Get Started' },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function NavBar() {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const desktopRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!openGroup) return
    function onClick(e: MouseEvent) {
      if (desktopRef.current && !desktopRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [openGroup])

  // Close on route change
  useEffect(() => { setOpenGroup(null) }, [pathname])

  // Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenGroup(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }
  function isGroupActive(group: NavGroup) {
    return group.items.some(i => isActive(i.href))
  }

  // Unmistakable active state: accent text + a solid underline bar flush with
  // the header's bottom border — not just a subtle tint.
  const itemClass = (active: boolean, open = false) =>
    `relative flex items-center gap-1.5 px-3 h-14 text-xs rounded-none transition-colors whitespace-nowrap
     focus-visible:outline-2 focus-visible:outline-[--accent] focus-visible:-outline-offset-2
     ${active
       ? 'text-[--accent] font-bold'
       : open
         ? 'text-[--text] font-medium bg-[--surface-secondary]'
         : 'text-[--text-secondary] font-medium hover:text-[--text] hover:bg-[--surface-secondary]'
     }`

  const ActiveBar = () => (
    <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[--accent]" aria-hidden="true" />
  )

  return (
    <div ref={desktopRef} className="flex-1 min-w-0 hidden md:flex items-center gap-0.5 self-stretch">
      {NAV_ITEMS.map(item => {
        if (item.kind === 'link') {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={itemClass(active)}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
              {active && <ActiveBar />}
            </Link>
          )
        }

        // Group — click-to-open (never hover-gated)
        const active = isGroupActive(item)
        const open = openGroup === item.label
        return (
          <div key={item.label} className="relative self-stretch flex">
            <button
              onClick={() => setOpenGroup(open ? null : item.label)}
              aria-expanded={open}
              aria-haspopup="menu"
              className={itemClass(active, open)}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
              {active && <ActiveBar />}
            </button>

            {open && (
              <div
                role="menu"
                className="absolute top-full left-0 mt-0 min-w-[230px] bg-[--surface] border border-[--border] rounded-b-lg shadow-lg py-1 z-50"
              >
                <p className="px-3 pt-2 pb-1.5 text-[10px] text-[--text-muted] border-b border-[--border] mb-1">
                  {item.description}
                </p>
                {item.items.map(sub => {
                  const subActive = isActive(sub.href)
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      role="menuitem"
                      aria-current={subActive ? 'page' : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[--accent] focus-visible:-outline-offset-2 ${
                        subActive
                          ? 'text-[--accent] font-bold bg-[--accent]/5 border-l-2 border-[--accent]'
                          : 'text-[--text-secondary] font-medium hover:text-[--accent] hover:bg-[--surface-secondary] border-l-2 border-transparent'
                      }`}
                    >
                      <sub.icon className="w-3.5 h-3.5" />
                      {sub.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

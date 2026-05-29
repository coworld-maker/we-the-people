'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, ChevronDown,
  LayoutDashboard, FileText, ScrollText, Grid3X3,
  Users, BarChart3, ClipboardList,
  Landmark, GraduationCap,
  Newspaper, Info, MessageSquare, ExternalLink,
  Vote, MapPin,
} from 'lucide-react'

// ── Nav structure ────────────────────────────────────────────────────────────
// Six top-level items: 3 simple links + 3 grouped dropdowns. Cuts the previous
// 12-item bar in half while keeping every page reachable in 2 clicks max.

interface NavLink { href: string; icon: any; label: string; external?: boolean }
interface NavGroup { label: string; icon: any; items: NavLink[] }
type NavItem =
  | ({ kind: 'link' } & NavLink)
  | ({ kind: 'group' } & NavGroup)

// Feedback URL is gated on an env var — link is hidden when unset so we
// never ship a button that goes nowhere.
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL || ''

const NAV_ITEMS: NavItem[] = [
  { kind: 'link', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    kind: 'group', label: 'Legislation', icon: FileText,
    items: [
      { href: '/bills',        icon: FileText,   label: 'Federal Bills' },
      { href: '/state-bills',  icon: Landmark,   label: 'State Legislature' },
      { href: '/policy-areas', icon: Grid3X3,    label: 'Policy Areas' },
      { href: '/documents',    icon: ScrollText, label: 'Documents' },
    ],
  },
  {
    kind: 'group', label: 'Representatives', icon: Users,
    items: [
      { href: '/my-representatives', icon: Users,          label: 'My Reps' },
      { href: '/scorecards',         icon: BarChart3,      label: 'Scorecards' },
      { href: '/voting-records',     icon: ClipboardList,  label: 'Voting Records' },
    ],
  },
  {
    kind: 'group', label: 'Engage', icon: Landmark,
    items: [
      { href: '/action-center', icon: Landmark,        label: 'Action Center' },
      { href: '/learn',         icon: GraduationCap,   label: 'Learn' },
      { href: '/transparency',  icon: BarChart3,       label: 'Stats' },
      ...(FEEDBACK_URL
        ? [{ href: FEEDBACK_URL, icon: MessageSquare, label: 'Share Feedback', external: true } as NavLink]
        : []),
    ],
  },
  { kind: 'link', href: '/elections', icon: Vote,     label: 'Elections' },
  { kind: 'link', href: '/news',      icon: Newspaper, label: 'News' },
  { kind: 'link', href: '/about',     icon: Info,      label: 'About' },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function NavBar() {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
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

  // Close everything on route change
  useEffect(() => {
    setOpenGroup(null)
    setMobileOpen(false)
  }, [pathname])

  // Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenGroup(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [mobileOpen])

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }
  function isGroupActive(group: NavGroup) {
    return group.items.some(i => isActive(i.href))
  }

  return (
    <>
      {/* ── Desktop nav (md+) ────────────────────────────────────────────── */}
      <div ref={desktopRef} className="flex-1 min-w-0 hidden md:flex items-center gap-0.5">
        {NAV_ITEMS.map(item => {
          if (item.kind === 'link') {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap
                  ${active
                    ? 'text-[--accent] bg-[--accent]/10'
                    : 'text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary]'
                  }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            )
          }

          // Group
          const active = isGroupActive(item)
          const open = openGroup === item.label
          return (
            <div key={item.label} className="relative">
              <button
                onClick={() => setOpenGroup(open ? null : item.label)}
                aria-expanded={open}
                aria-haspopup="menu"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap
                  ${active || open
                    ? 'text-[--accent] bg-[--accent]/10'
                    : 'text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary]'
                  }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{item.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-1 min-w-[210px] bg-[--surface] border border-[--border] rounded-lg shadow-lg py-1 z-50"
                >
                  {item.items.map(sub => {
                    const subActive = !sub.external && isActive(sub.href)
                    const linkClass = `flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                      subActive
                        ? 'text-[--accent] bg-[--accent]/5'
                        : 'text-[--text-secondary] hover:text-[--accent] hover:bg-[--surface-secondary]'
                    }`
                    return sub.external ? (
                      <a
                        key={sub.href}
                        href={sub.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        className={linkClass}
                      >
                        <sub.icon className="w-3.5 h-3.5" />
                        <span className="flex-1">{sub.label}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        role="menuitem"
                        className={linkClass}
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

      {/* ── Mobile hamburger button (< md) ───────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden flex-1 flex justify-end"
        aria-label="Open navigation menu"
      >
        <span className="p-2 text-[--text-secondary] hover:text-[--accent] rounded-md transition-colors">
          <Menu className="w-5 h-5" />
        </span>
      </button>

      {/* ── Mobile drawer (< md) ─────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-[--surface] z-50 md:hidden shadow-xl flex flex-col">
            <div className="px-4 py-4 border-b border-[--border] flex items-center justify-between shrink-0">
              <span className="font-display font-bold text-sm text-[--text]">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-[--text-muted] hover:text-[--text] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV_ITEMS.map(item => {
                if (item.kind === 'link') {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                        ${active
                          ? 'text-[--accent] bg-[--accent]/10 border-r-2 border-[--accent]'
                          : 'text-[--text-secondary] hover:bg-[--surface-secondary]'
                        }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                }
                // Group: section header + items, slightly indented
                return (
                  <div key={item.label} className="py-1">
                    <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[--text-muted] flex items-center gap-2">
                      <item.icon className="w-3 h-3" />
                      {item.label}
                    </div>
                    {item.items.map(sub => {
                      const subActive = !sub.external && isActive(sub.href)
                      const linkClass = `flex items-center gap-3 pl-9 pr-4 py-2.5 text-sm font-medium transition-colors ${
                        subActive
                          ? 'text-[--accent] bg-[--accent]/10 border-r-2 border-[--accent]'
                          : 'text-[--text-secondary] hover:bg-[--surface-secondary]'
                      }`
                      return sub.external ? (
                        <a
                          key={sub.href}
                          href={sub.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                        >
                          <sub.icon className="w-3.5 h-3.5" />
                          <span className="flex-1">{sub.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={linkClass}
                        >
                          <sub.icon className="w-3.5 h-3.5" />
                          {sub.label}
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}

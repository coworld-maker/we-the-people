'use client'

/**
 * Global command palette — the universal escape hatch when navigation fails.
 * Opens with Cmd+K / Ctrl+K, the header search field, or a custom
 * 'open-command-palette' window event. Searches bills, reps, and topics
 * via /api/search with a debounced fetch.
 *
 * Built without the cmdk library (package installs unavailable in this
 * environment) — plain React with listbox keyboard semantics.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search, FileText, Users, Grid3X3, CornerDownLeft,
  LayoutDashboard, Landmark, Loader2,
} from 'lucide-react'

interface Result {
  label: string
  href: string
  code?: string
  detail?: string | null
  status?: string
  policyArea?: string | null
}

interface SearchResponse {
  bills: Result[]
  reps: Result[]
  topics: Result[]
}

// Shown before the user types — the four task sections, so the palette
// doubles as a nav teaching aid.
const QUICK_LINKS: Result[] = [
  { label: 'Home — your dashboard', href: '/dashboard' },
  { label: 'Track — browse federal bills', href: '/bills' },
  { label: 'Know — your representatives', href: '/my-representatives' },
  { label: 'Act — contact reps & take action', href: '/act' },
]

const QUICK_ICONS = [LayoutDashboard, FileText, Users, Landmark]

export default function CommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Flatten grouped results into one keyboard-navigable list
  const flat: Array<Result & { group: string }> = query.trim().length >= 2 && results
    ? [
        ...results.bills.map(r => ({ ...r, group: 'Bills' })),
        ...results.reps.map(r => ({ ...r, group: 'Representatives' })),
        ...results.topics.map(r => ({ ...r, group: 'Topics' })),
      ]
    : QUICK_LINKS.map(r => ({ ...r, group: 'Go to' }))

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults(null)
    setActiveIndex(0)
  }, [])

  // Open triggers: Cmd+K / Ctrl+K, and the header field's custom event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    function onOpenEvent() { setOpen(true) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpenEvent)
    }
  }, [])

  // Close on route change
  useEffect(() => { close() }, [pathname, close])

  // Focus input + lock scroll while open
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults(null); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        if (res.ok) {
          setResults(await res.json())
          setActiveIndex(0)
        }
      } catch {} finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  function select(item: Result) {
    close()
    router.push(item.href)
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flat[activeIndex]) {
      e.preventDefault()
      select(flat[activeIndex])
    }
  }

  // Keep the active option scrolled into view
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  const groupIcon = (group: string) =>
    group === 'Bills' ? FileText
    : group === 'Representatives' ? Users
    : group === 'Topics' ? Grid3X3
    : Search

  let renderedGroup = ''
  const noResults = query.trim().length >= 2 && !loading && results && flat.length === 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />

      <div className="relative w-full max-w-xl bg-[--surface] rounded-xl shadow-2xl border border-[--border] overflow-hidden">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 border-b border-[--border]">
          {loading
            ? <Loader2 className="w-4 h-4 text-[--text-muted] animate-spin shrink-0" />
            : <Search className="w-4 h-4 text-[--text-muted] shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={flat[activeIndex] ? `palette-option-${activeIndex}` : undefined}
            placeholder="Search bills, representatives, topics…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            className="flex-1 py-3.5 text-sm bg-transparent text-[--text] placeholder-[--text-muted] focus:outline-none"
          />
          <kbd className="hidden sm:block text-[10px] font-semibold text-[--text-muted] border border-[--border] rounded px-1.5 py-0.5">esc</kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="palette-results"
          role="listbox"
          className="max-h-[50vh] overflow-y-auto py-2"
        >
          {noResults && (
            <p className="px-4 py-6 text-sm text-[--text-muted] text-center">
              No results for “{query.trim()}” — try a bill number like “HR 2847” or a rep&apos;s last name.
            </p>
          )}

          {flat.map((item, i) => {
            const showHeader = item.group !== renderedGroup
            renderedGroup = item.group
            const Icon = item.group === 'Go to' ? QUICK_ICONS[i] ?? Search : groupIcon(item.group)
            const active = i === activeIndex
            return (
              <div key={`${item.href}-${i}`}>
                {showHeader && (
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[--text-muted]">
                    {item.group}
                  </p>
                )}
                <button
                  id={`palette-option-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={active}
                  onClick={() => select(item)}
                  onMouseMove={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    active ? 'bg-[--accent]/10' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[--accent]' : 'text-[--text-muted]'}`} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm font-medium truncate ${active ? 'text-[--accent]' : 'text-[--text]'}`}>
                      {item.code && <span className="font-bold mr-1.5">{item.code}</span>}
                      {item.label}
                    </span>
                    {item.detail && (
                      <span className="block text-xs text-[--text-muted] truncate">{item.detail}</span>
                    )}
                  </span>
                  {active && <CornerDownLeft className="w-3.5 h-3.5 text-[--text-muted] shrink-0" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-[--border] bg-[--surface-secondary]/50 flex items-center gap-4 text-[10px] text-[--text-muted]">
          <span><kbd className="font-semibold">↑↓</kbd> navigate</span>
          <span><kbd className="font-semibold">↵</kbd> open</span>
          <span><kbd className="font-semibold">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

'use client'

/**
 * Header search trigger. Looks like a search field on desktop (with the ⌘K
 * hint), collapses to an icon button on mobile. Opens the CommandPalette
 * via a window event so the palette can live once at the layout root.
 */

import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function SearchButton() {
  const [isMac, setIsMac] = useState(true)
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
  }, [])

  function openPalette() {
    window.dispatchEvent(new Event('open-command-palette'))
  }

  return (
    <>
      {/* Desktop: field-style button */}
      <button
        onClick={openPalette}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[--border] bg-[--surface-secondary]/60 text-[--text-muted] hover:border-[--accent]/40 hover:text-[--text] transition-colors text-xs min-w-[180px] focus-visible:outline-2 focus-visible:outline-[--accent]"
        aria-label="Search bills, representatives, and topics"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[10px] font-semibold border border-[--border] rounded px-1 py-px bg-[--surface]">
          {isMac ? '⌘' : 'Ctrl+'}K
        </kbd>
      </button>

      {/* Mobile: icon button */}
      <button
        onClick={openPalette}
        className="md:hidden p-2 text-[--text-secondary] hover:text-[--accent] rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[--accent]"
        aria-label="Search bills, representatives, and topics"
      >
        <Search className="w-5 h-5" />
      </button>
    </>
  )
}

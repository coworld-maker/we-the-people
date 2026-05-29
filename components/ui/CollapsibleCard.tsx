'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  storageKey: string
  title: string
  icon?: React.ReactNode        // left of title (e.g. coloured dot, sparkle)
  headerRight?: React.ReactNode // right of title, left of chevron (e.g. badge, button)
  defaultOpen?: boolean
  className?: string
  children: React.ReactNode
}

export default function CollapsibleCard({
  storageKey,
  title,
  icon,
  headerRight,
  defaultOpen = true,
  className,
  children,
}: Props) {
  // Start with default; swap from localStorage after mount to avoid SSR mismatch
  const [open, setOpen] = useState(defaultOpen)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(`card_open_${storageKey}`)
    if (saved !== null) setOpen(saved === '1')
    setReady(true)
  }, [storageKey])

  function toggle() {
    const next = !open
    setOpen(next)
    localStorage.setItem(`card_open_${storageKey}`, next ? '1' : '0')
  }

  return (
    <div className={`card overflow-hidden ${className ?? ''}`}>
      {/* Header — full row is the toggle trigger */}
      <button
        onClick={toggle}
        className="w-full px-6 py-4 border-b border-[--border] flex items-center gap-2 hover:bg-[--surface-secondary]/60 transition-colors text-left group"
        aria-expanded={open}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="font-display text-sm font-bold text-[--text] flex-1">{title}</span>
        {/* Extra header content — clicks don't collapse the card */}
        {headerRight && (
          <span
            className="flex items-center gap-2"
            onClick={e => e.stopPropagation()}
          >
            {headerRight}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-[--text-muted] shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Collapsible body — CSS grid-rows trick: smooth, no height guessing */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

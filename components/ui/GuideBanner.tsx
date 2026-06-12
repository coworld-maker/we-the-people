'use client'

/**
 * Dismissible guide strip for newcomers. On mobile this is the only
 * always-visible path to the guide (the Get Started nav item is desktop-only
 * and the tab bar is capped at four tabs), so it renders above the dashboard
 * content until the user dismisses it or stops being new.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, X, ArrowRight } from 'lucide-react'
import { track } from '@/lib/track'

const DISMISS_KEY = 'guide-banner-dismissed'

export default function GuideBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = localStorage.getItem(DISMISS_KEY) !== '1'
    setVisible(show)
    if (show) track('guide_view', { surface: 'banner' })
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[--accent-light] border border-[--accent]/20">
      <GraduationCap className="w-4 h-4 text-[--accent] shrink-0" />
      <p className="flex-1 text-xs text-[--text] leading-snug">
        <span className="font-semibold">New here?</span>{' '}
        <span className="text-[--text-secondary]">
          The 2-minute guide explains how to find bills, vote, and reach your rep.
        </span>
      </p>
      <Link
        href="/get-started?from=banner"
        onClick={() => track('guide_click', { source: 'banner' })}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-[--accent] hover:underline"
      >
        See the guide <ArrowRight className="w-3 h-3" />
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss guide banner"
        className="shrink-0 p-1 text-[--text-muted] hover:text-[--text] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

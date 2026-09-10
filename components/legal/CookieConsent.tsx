'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie-consent-v1'

type ConsentState =
  | { decided: false }
  | { decided: true; functional: boolean; ts: string }

function readConsent(): ConsentState {
  if (typeof window === 'undefined') return { decided: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { decided: false }
    const parsed = JSON.parse(raw)
    return parsed.decided
      ? { decided: true, functional: !!parsed.functional, ts: parsed.ts }
      : { decided: false }
  } catch {
    return { decided: false }
  }
}

/**
 * Read the user's cookie consent state outside of React. Lets non-component
 * code (e.g. localStorage feature flags) check whether functional cookies
 * are allowed before writing them.
 *
 *   import { hasFunctionalConsent } from '@/components/legal/CookieConsent'
 *   if (hasFunctionalConsent()) localStorage.setItem('selected-state', 'CA')
 */
export function hasFunctionalConsent(): boolean {
  const s = readConsent()
  return s.decided && s.functional
}

/**
 * GDPR-compliant cookie banner. Renders only when the user hasn't yet decided.
 * Two explicit choices: accept all functional cookies, or essential only.
 * No "OK" or "continue without choosing" patterns (those don't constitute
 * consent under GDPR).
 *
 * A compact full-width bar rather than a floating card: the card was ~230px
 * tall and sat on top of the ZIP field on phones and the "See who's behind it"
 * button on desktop. While it is showing, the body is padded by the bar's own
 * height so every part of the page can still be scrolled into view above it.
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const consent = readConsent()
    if (!consent.decided) setShow(true)
  }, [])

  useEffect(() => {
    const bar = barRef.current
    if (!show || !bar) return
    const body = document.body
    const html = document.documentElement
    const prev = body.style.paddingBottom
    const prevScroll = html.style.scrollPaddingBottom
    // scroll-padding keeps a Tab-focused control from landing under the bar (WCAG 2.4.11).
    const sync = () => {
      body.style.paddingBottom = `${bar.offsetHeight}px`
      html.style.scrollPaddingBottom = `${bar.offsetHeight}px`
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(bar)
    return () => {
      ro.disconnect()
      body.style.paddingBottom = prev
      html.style.scrollPaddingBottom = prevScroll
    }
  }, [show])

  function decide(functional: boolean) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ decided: true, functional, ts: new Date().toISOString() }),
      )
    } catch {
      // best-effort — if localStorage is blocked, we'll re-prompt next visit
    }
    setShow(false)
    // Dispatch an event so other parts of the app can react if needed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { functional } }))
    }
  }

  if (!show) return null

  return (
    <div
      ref={barRef}
      role="region"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-50 bg-[--surface] border-t border-[--border-strong] shadow-[0_-4px_16px_rgba(15,23,42,0.08)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-6">
        <p id="cookie-body" className="flex-1 min-w-0 text-[13px] text-[--text-secondary] leading-snug">
          <span id="cookie-title" className="font-semibold text-[--text]">We use a few cookies.</span>{' '}
          Login and security always run; remembering your state and reading position needs your OK.
          No ads or third-party trackers.{' '}
          <Link href="/privacy#4-cookies-and-tracking" className="underline text-[--accent] hover:text-[--accent-hover]">
            Read more
          </Link>
        </p>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => decide(false)}
            className="flex-1 sm:flex-none min-h-[44px] px-4 rounded-lg text-sm font-semibold bg-[--surface-secondary] text-[--text] border border-[--border-strong] hover:bg-[--surface-tertiary] transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => decide(true)}
            className="flex-1 sm:flex-none min-h-[44px] px-4 rounded-lg text-sm font-semibold bg-[--accent] text-white hover:bg-[--accent-hover] transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}

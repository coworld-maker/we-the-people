'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

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
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = readConsent()
    if (!consent.decided) setShow(true)
  }, [])

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
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-body"
      className="fixed inset-x-3 bottom-3 sm:bottom-4 sm:inset-x-auto sm:right-4 sm:max-w-md z-50"
    >
      <div className="bg-[--surface] border border-[--border] shadow-xl rounded-xl overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[--accent-light] flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4 text-[--accent]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="cookie-title" className="font-display text-sm font-bold text-[--text] mb-1">
              We use a few cookies
            </h3>
            <p id="cookie-body" className="text-xs text-[--text-secondary] leading-relaxed">
              Strictly-necessary cookies (login, security) always run. Functional
              cookies — remembering your state, interests, and reading position —
              need your OK first. We don't use ads or third-party trackers.{' '}
              <Link href="/privacy#4-cookies-and-tracking" className="underline text-[--accent] hover:text-[--accent-hover]">
                Read more
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="px-5 pb-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => decide(true)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[--accent] text-white hover:bg-[--accent-hover] transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={() => decide(false)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[--surface-secondary] text-[--text-secondary] hover:bg-[--surface-tertiary] transition-colors"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Client-side analytics helper. Fire-and-forget — never throws, never blocks.
 *
 * Privacy: events are anonymous (name, path, viewport class, small meta).
 * A random per-tab session id is attached ONLY when the user has accepted
 * functional cookies, enabling session-level analysis (dead-end detection)
 * for consented users while everyone else contributes anonymous counts.
 */

import { hasFunctionalConsent } from '@/components/legal/CookieConsent'

const SESSION_KEY = 'du-session-id'

function sessionId(): string | null {
  if (!hasFunctionalConsent()) return null
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

export function track(event: string, meta?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify({
      event,
      meta,
      path: window.location.pathname,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
      sessionId: sessionId(),
    })
    // sendBeacon survives page unloads (nav clicks navigate away immediately)
    const sent = navigator.sendBeacon?.(
      '/api/track',
      new Blob([body], { type: 'application/json' })
    )
    if (!sent) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {}
}

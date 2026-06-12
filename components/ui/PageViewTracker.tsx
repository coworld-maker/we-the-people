'use client'

/**
 * Fires a single page_view event on mount. Drop into any page that needs
 * view-level instrumentation (dead-end detection on bill detail, entry-point
 * attribution on /get-started via the ?from= query param).
 */

import { useEffect } from 'react'
import { track } from '@/lib/track'

export default function PageViewTracker({ page }: { page: string }) {
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from')
    track('page_view', from ? { page, from } : { page })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

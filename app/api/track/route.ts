/**
 * POST /api/track — anonymous product instrumentation.
 *
 * Public route (bill pages are public, and signed-out share-link visitors
 * are exactly who dead-end detection needs to see). Stores no user IDs and
 * no IP addresses; sessionId arrives only when the client has functional
 * cookie consent (see lib/track.ts).
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Whitelist so the endpoint can't be used to stuff arbitrary garbage
const ALLOWED_EVENTS = new Set([
  'nav_click',
  'search_open',
  'search_select',
  'search_abandon',
  'guide_view',
  'guide_click',
  'page_view',
])

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body.event !== 'string' || !ALLOWED_EVENTS.has(body.event)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    await (prisma as any).analyticsEvent.create({
      data: {
        event: body.event,
        path: typeof body.path === 'string' ? body.path.slice(0, 200) : null,
        device: body.device === 'mobile' || body.device === 'desktop' ? body.device : null,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 40) : null,
        meta: body.meta && typeof body.meta === 'object' ? body.meta : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    // Analytics must never break anything — swallow and report ok
    console.error('[track] write failed:', e)
    return NextResponse.json({ ok: true })
  }
}

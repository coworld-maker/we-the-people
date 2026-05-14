// app/api/cron/sync-votes/route.ts
//
// Vercel cron job — runs daily at 07:00 UTC (≈ 2am ET / 3am EDT).
// Configured in vercel.json: { "path": "/api/cron/sync-votes", "schedule": "0 7 * * *" }
//
// Vercel sends: GET /api/cron/sync-votes
//               Authorization: Bearer <CRON_SECRET>
//
// We forward the request as a POST to /api/sync-congress-votes so we can pass
// the body parameters (chamber, maxVotes, etc.) that the sync route expects.

import { NextRequest, NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

// Vercel cron requests always include "Authorization: Bearer <CRON_SECRET>"
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${CRON_SECRET}`
}

// Resolve the base URL for internal API calls.
// On Vercel: VERCEL_URL is set automatically (e.g. democracyunlocked.com).
// Locally: fall back to localhost.
function baseUrl(): string {
  if (process.env.VERCEL_URL) {
    // VERCEL_URL doesn't include the protocol
    return `https://${process.env.VERCEL_URL}`
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

export const maxDuration = 55 // stay under Vercel's 60s hobby limit

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = { startedAt: new Date().toISOString() }

  try {
    // Sync the most recent 25 roll calls for each chamber.
    // We run house and senate sequentially to avoid hammering external APIs.
    for (const chamber of ['house', 'senate'] as const) {
      const res = await fetch(`${baseUrl()}/api/sync-congress-votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-secret': CRON_SECRET ?? '',
        },
        body: JSON.stringify({
          congress: 119,
          session: 1,
          chamber,
          maxVotes: 25,
        }),
      })

      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      results[chamber] = data
    }

    results.completedAt = new Date().toISOString()
    return NextResponse.json({ success: true, ...results })
  } catch (err: any) {
    console.error('[cron/sync-votes] fatal error:', err)
    return NextResponse.json({ error: err.message, ...results }, { status: 500 })
  }
}

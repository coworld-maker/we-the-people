/**
 * GET /api/representatives/district?zip=30310
 *
 * Resolves a ZIP to the congressional district(s) it touches, using the bundled
 * static ZCTA→district dataset. See lib/data/zip-lookup.ts for provenance and
 * for why a single-district answer was wrong.
 *
 * A ZIP that spans several districts has no single correct answer, so this
 * returns every match and sets `ambiguous`. `state` and `district` are populated
 * ONLY when the answer is unambiguous; when it isn't they are null, so a caller
 * that ignores `ambiguous` renders nothing rather than confidently rendering the
 * wrong representative.
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { lookupZip } from '@/lib/data/zip-lookup'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')?.trim()
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Valid 5-digit zip required' }, { status: 400 })
  }

  const found = lookupZip(zip)
  if (!found) {
    return NextResponse.json({
      error: 'No district found for this zip',
      zip, matches: [], ambiguous: false, crossState: false,
      state: null, district: null,
    })
  }

  const single = found.ambiguous ? null : found.matches[0]

  return NextResponse.json({
    zip,
    matches: found.matches,
    ambiguous: found.ambiguous,
    crossState: found.crossState,
    // Null when ambiguous — deliberately. Do not fall back to matches[0].
    state: single?.state ?? null,
    district: single?.district ?? null,
  })
}

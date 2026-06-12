/**
 * GET /api/representatives/district?zip=30310
 *
 * Resolves a zip code to a congressional district using a bundled static
 * ZCTA→district dataset (OpenSourceActivismTech/us-zipcodes-congress).
 * No external API: Google retired the Civic Information API's representative
 * lookup, and Congress.gov's /v3/member silently ignores its zipCode param
 * (it returns an arbitrary member list — we shipped that bug briefly).
 *
 * Multi-district zips are mapped to their dominant district. PO-box-only
 * zips aren't ZCTAs and won't resolve — the UI suggests a nearby zip.
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import zipDistricts from '@/lib/data/zip-districts.json'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')?.trim()
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Valid 5-digit zip required' }, { status: 400 })
  }

  const entry = (zipDistricts as Record<string, string>)[zip]
  if (!entry) {
    return NextResponse.json({ error: 'No district found for this zip', district: null })
  }

  // Entries look like "GA-5"; at-large states use district 0
  const [state, district] = entry.split('-')

  return NextResponse.json({ district, state, zip })
}

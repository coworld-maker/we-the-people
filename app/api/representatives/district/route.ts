/**
 * GET /api/representatives/district?zip=30301
 *
 * Uses the Google Civic Information API to look up the congressional district
 * for a given zip code, returning the district number + state code.
 *
 * Falls back gracefully if the API key is missing or the request fails.
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const CIVIC_KEY = process.env.GOOGLE_CIVIC_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_CIVIC_API_KEY

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')?.trim()
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Valid 5-digit zip required' }, { status: 400 })
  }

  if (!CIVIC_KEY) {
    return NextResponse.json({ error: 'Civic API key not configured', district: null })
  }

  try {
    const url = new URL('https://www.googleapis.com/civicinfo/v2/representatives')
    url.searchParams.set('address', zip)
    url.searchParams.set('levels', 'country')
    url.searchParams.set('roles', 'legislatorLowerBody')
    url.searchParams.set('key', CIVIC_KEY)

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) {
      const err = await res.text()
      console.error('[district] Civic API error:', res.status, err)
      return NextResponse.json({ error: 'Civic API error', district: null })
    }

    const data = await res.json()

    // Parse OCD division IDs like "ocd-division/country:us/state:ga/cd:5"
    let district: string | null = null
    let state: string | null = null

    for (const divisionId of Object.keys(data.divisions || {})) {
      const cdMatch = divisionId.match(/\/state:([a-z]{2})\/cd:(\d+)/)
      if (cdMatch) {
        state = cdMatch[1].toUpperCase()
        district = cdMatch[2]
        break
      }
    }

    return NextResponse.json({ district, state, zip })
  } catch (e) {
    console.error('[district] fetch error:', e)
    return NextResponse.json({ error: 'Lookup failed', district: null })
  }
}

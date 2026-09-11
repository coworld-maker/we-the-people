import { NextResponse } from 'next/server'
import { parseCensusDistrict } from './parse'

/**
 * POST { street, zip } → { state, district } via the US Census Bureau geocoder.
 *
 * Used by the landing hero when a ZIP spans several districts and the visitor
 * doesn't know theirs. The street address is personal data: it arrives in the
 * POST body only, is forwarded once to the Census geocoder, and is never
 * logged, stored, or echoed back in any response (errors included).
 */

const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/address'
const NO_MATCH = "We couldn't match that address. Check the street and try again, or pick your district above."
const UPSTREAM_DOWN = "The Census address lookup isn't responding right now. Pick your district above, or try again in a moment."

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: any
  try { body = await req.json() } catch { body = null }
  const street = typeof body?.street === 'string' ? body.street.trim() : ''
  const zip = typeof body?.zip === 'string' ? body.zip.trim() : ''
  if (street.length < 1 || street.length > 200) {
    return NextResponse.json({ error: 'Enter your street address (up to 200 characters).' }, { status: 400 })
  }
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'A five-digit ZIP code is required.' }, { status: 400 })
  }

  const params = new URLSearchParams({
    street, zip,
    benchmark: 'Public_AR_Current',
    vintage: 'Current_Current',
    layers: 'all',
    format: 'json',
  })

  let json: unknown
  try {
    const res = await fetch(`${CENSUS_URL}?${params}`, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ error: UPSTREAM_DOWN }, { status: 502 })
    json = await res.json()
  } catch {
    // Deliberately no logging: the error could carry the request URL (and so the address).
    return NextResponse.json({ error: UPSTREAM_DOWN }, { status: 502 })
  }

  const match = parseCensusDistrict(json)
  if (!match) return NextResponse.json({ error: NO_MATCH }, { status: 404 })
  return NextResponse.json(match, { headers: { 'Cache-Control': 'no-store' } })
}

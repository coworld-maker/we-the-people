/**
 * GET /api/representatives/district?zip=30301
 *
 * Uses the Congress.gov API (same key already in use sitewide) to look up
 * the congressional district for a zip code.
 *
 * Congress.gov /member?zipCode=XXXXX returns current members for that zip —
 * we extract the House member's district number and state from those results.
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')?.trim()
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Valid 5-digit zip required' }, { status: 400 })
  }

  if (!CONGRESS_API_KEY) {
    return NextResponse.json({ error: 'Congress API key not configured', district: null })
  }

  try {
    const url = `https://api.congress.gov/v3/member?zipCode=${zip}&currentMember=true&limit=10&api_key=${CONGRESS_API_KEY}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      console.error('[district] Congress API error:', res.status)
      return NextResponse.json({ error: 'Lookup failed', district: null })
    }

    const data = await res.json()
    const members: any[] = data.members || []

    // Find the House member — they have a district number
    const houseMember = members.find((m: any) => {
      const term = m.terms?.item?.[0]
      return term?.chamber === 'House of Representatives'
    })

    if (!houseMember) {
      return NextResponse.json({ error: 'No House member found for this zip', district: null })
    }

    const district = houseMember.district != null ? String(houseMember.district) : null
    const state = houseMember.state || null

    return NextResponse.json({ district, state, zip, memberName: houseMember.name })
  } catch (e) {
    console.error('[district] fetch error:', e)
    return NextResponse.json({ error: 'Lookup failed', district: null })
  }
}

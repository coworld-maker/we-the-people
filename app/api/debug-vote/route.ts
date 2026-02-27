// app/api/debug-vote/route.ts
// Temporary debug endpoint to inspect the house-vote API response
import { NextRequest, NextResponse } from 'next/server'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'
const API_KEY = process.env.CONGRESS_API_KEY

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-sync-secret') === process.env.CRON_SECRET
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const congress = req.nextUrl.searchParams.get('congress') ?? '119'
  const session = req.nextUrl.searchParams.get('session') ?? '1'
  const roll = req.nextUrl.searchParams.get('roll') ?? '45'
  const billId = req.nextUrl.searchParams.get('billId') ?? ''

  const results: any = {}

  // Test 1: house-vote members endpoint
  const membersUrl = `${CONGRESS_API_BASE}/house-vote/${congress}/${session}/${roll}/members?limit=10&api_key=${API_KEY}&format=json`
  try {
    const res = await fetch(membersUrl)
    results.membersEndpoint = {
      url: membersUrl.replace(API_KEY!, 'REDACTED'),
      status: res.status,
      body: await res.json().catch(() => res.text()),
    }
  } catch (err: any) {
    results.membersEndpoint = { error: err.message }
  }

  // Test 2: house-vote item endpoint
  const itemUrl = `${CONGRESS_API_BASE}/house-vote/${congress}/${session}/${roll}?api_key=${API_KEY}&format=json`
  try {
    const res = await fetch(itemUrl)
    results.itemEndpoint = {
      url: itemUrl.replace(API_KEY!, 'REDACTED'),
      status: res.status,
      body: await res.json().catch(() => res.text()),
    }
  } catch (err: any) {
    results.itemEndpoint = { error: err.message }
  }

  // Test 3: bill actions to see recordedVotes shape (if billId provided)
  if (billId) {
    const actionsUrl = `${CONGRESS_API_BASE}/bill/119/hr/1/actions?limit=20&api_key=${API_KEY}&format=json`
    // We'll just show the first few actions to understand the shape
  }

  return NextResponse.json(results)
}

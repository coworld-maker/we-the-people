import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'

/**
 * POST /api/bills/refresh-policy-areas?limit=N
 *
 * Re-fetches details from Congress.gov for bills with policyArea = NULL
 * and updates the column when CRS has assigned one in the meantime.
 * Zero AI cost — just normalized metadata from the authoritative source.
 *
 * Response:
 *   {
 *     processed: 10,         // bills attempted
 *     refreshed: 7,          // got a new policyArea from CRS
 *     stillMissing: 3,       // congress.gov returned no policyArea yet
 *     failed: 0,             // network / parse errors
 *     remaining: 493,        // bills still with policyArea = NULL after batch
 *   }
 */

async function fetchBillDetails(congress: string, billType: string, billNumber: string) {
  const apiKey = process.env.CONGRESS_API_KEY
  if (!apiKey) return null
  try {
    const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType.toLowerCase()}/${billNumber}?api_key=${apiKey}&format=json`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.bill ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.CONGRESS_API_KEY) {
    return NextResponse.json(
      { error: 'CONGRESS_API_KEY not configured' },
      { status: 503 },
    )
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '15'), 30)

  const uncategorized = await prisma.bill.findMany({
    where: { policyArea: null },
    select: { id: true, congress: true, billType: true, billNumber: true },
    take: limit,
    orderBy: { introducedDate: 'desc' },
  })

  let refreshed = 0
  let stillMissing = 0
  let failed = 0

  // Process in parallel — congress.gov can handle ~10 concurrent requests fine
  await Promise.allSettled(
    uncategorized.map(async (b) => {
      try {
        const details = await fetchBillDetails(b.congress, b.billType, b.billNumber)
        const policyArea = details?.policyArea?.name as string | undefined
        if (policyArea) {
          await prisma.bill.update({ where: { id: b.id }, data: { policyArea } })
          refreshed++
        } else {
          stillMissing++
        }
      } catch (e) {
        failed++
        console.error(`Refresh failed for ${b.billType} ${b.billNumber}:`, e)
      }
    }),
  )

  const remaining = await prisma.bill.count({ where: { policyArea: null } })

  return NextResponse.json({
    processed: uncategorized.length,
    refreshed,
    stillMissing,
    failed,
    remaining,
  })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const remaining = await prisma.bill.count({ where: { policyArea: null } })
  return NextResponse.json({ remaining })
}

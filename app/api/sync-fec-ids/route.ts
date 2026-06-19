// Syncs FEC candidate IDs from unitedstates/congress-legislators into the Representative table.
// Triggered by cron or manually: POST /api/sync-fec-ids with Bearer CRON_SECRET.
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getFECCommittees } from '@/lib/api/fec'
import { checkSyncAuth } from '@/lib/auth/syncAuth'

// NOTE: the repo publishes JSON via GitHub Pages, not raw.githubusercontent
// (the old raw/main/*.json path now 404s — which silently broke this sync).
const LEGISLATORS_URL =
  'https://unitedstates.github.io/congress-legislators/legislators-current.json'

interface Legislator {
  id: { bioguide?: string; fec?: string[] }
  name: { official_full?: string; first?: string; last?: string }
}

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkSyncAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(LEGISLATORS_URL, { next: { revalidate: 86400 } })
    if (!res.ok) throw new Error(`Failed to fetch legislators: ${res.status}`)
    const legislators: Legislator[] = await res.json()

    const bioguideToFec = new Map<string, string[]>()
    for (const leg of legislators) {
      const bioguide = leg.id?.bioguide
      const fecIds = leg.id?.fec ?? []
      if (bioguide && fecIds.length > 0) {
        bioguideToFec.set(bioguide, fecIds)
      }
    }

    // Only update reps that have FEC IDs available
    const reps = await prisma.representative.findMany({
      where: { currentTerm: true },
      select: { id: true, bioguideId: true, fullName: true },
    })

    let updated = 0
    let committeesFetched = 0

    for (const rep of reps) {
      const fecIds = bioguideToFec.get(rep.bioguideId)
      if (!fecIds || fecIds.length === 0) continue

      // Pre-fetch committee IDs to speed up page-load queries
      const committeeIds: string[] = []
      if (process.env.OPEN_FEC_API_KEY) {
        for (const fecId of fecIds.slice(0, 2)) {
          try {
            const committees = await getFECCommittees(fecId)
            committeeIds.push(...committees.map(c => c.committeeId))
            committeesFetched++
          } catch {
            // non-fatal — will be resolved at page-load
          }
        }
      }

      await prisma.representative.update({
        where: { id: rep.id },
        data: {
          fecIds,
          fecCommitteeIds: committeeIds,
        },
      })
      updated++
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bioguidesMapped: bioguideToFec.size,
      repsUpdated: updated,
      committeesFetched,
    })
  } catch (e) {
    console.error('[sync-fec-ids]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

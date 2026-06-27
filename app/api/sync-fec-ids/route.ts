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

export const maxDuration = 300

// Stop well short of Vercel's 300s function ceiling and return partial progress
// instead of letting the run hit a 504. At 02:00 UTC every sync job hammers the
// Supabase pooler at once, so the (previously sequential) per-rep work could
// crawl past the limit — that was the recurring FUNCTION_INVOCATION_TIMEOUT.
const TIME_BUDGET_MS = 250_000
// Write fecIds with bounded concurrency rather than ~535 sequential round-trips.
const DB_CONCURRENCY = 25

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

  const startedAt = Date.now()

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
      select: { id: true, bioguideId: true, fecCommitteeIds: true },
    })

    const targets = reps
      .map(rep => ({ rep, fecIds: bioguideToFec.get(rep.bioguideId) }))
      .filter((t): t is { rep: (typeof reps)[number]; fecIds: string[] } =>
        Array.isArray(t.fecIds) && t.fecIds.length > 0
      )

    // ── 1. Write fecIds for every mapped rep (cheap, static source) ──────────
    // Bounded-concurrency batches instead of ~535 sequential round-trips — the
    // sequential version was the slow path that tripped the 300s timeout when
    // the pooler was busy. Only fecIds is written here so we never clobber an
    // existing fecCommitteeIds with an empty array.
    let updated = 0
    for (let i = 0; i < targets.length; i += DB_CONCURRENCY) {
      const chunk = targets.slice(i, i + DB_CONCURRENCY)
      await Promise.all(
        chunk.map(({ rep, fecIds }) =>
          prisma.representative.update({ where: { id: rep.id }, data: { fecIds } })
        )
      )
      updated += chunk.length
    }

    // ── 2. Committee pre-fetch (external FEC API — the slow part) ─────────────
    // Only when a key is set, only for reps still missing committee IDs, and
    // only within the time budget. Whatever isn't reached this run is picked up
    // on the next run, so the job makes forward progress without ever timing out.
    let committeesFetched = 0
    let committeeBudgetHit = false
    if (process.env.OPEN_FEC_API_KEY) {
      const needCommittees = targets.filter(({ rep }) => !rep.fecCommitteeIds?.length)
      for (const { rep, fecIds } of needCommittees) {
        if (Date.now() - startedAt > TIME_BUDGET_MS) {
          committeeBudgetHit = true
          break
        }
        const committeeIds: string[] = []
        for (const fecId of fecIds.slice(0, 2)) {
          try {
            const committees = await getFECCommittees(fecId)
            committeeIds.push(...committees.map(c => c.committeeId))
            committeesFetched++
          } catch {
            // non-fatal — will be resolved at page-load
          }
        }
        if (committeeIds.length > 0) {
          await prisma.representative.update({
            where: { id: rep.id },
            data: { fecCommitteeIds: committeeIds },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bioguidesMapped: bioguideToFec.size,
      repsUpdated: updated,
      committeesFetched,
      committeeBudgetHit,
    })
  } catch (e) {
    console.error('[sync-fec-ids]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

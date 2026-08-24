// Syncs LDA lobbying firm counts for all bills in the DB.
// Triggered by cron or manually: POST /api/sync-lobbying with Bearer CRON_SECRET.
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getLobbyingFirmCount } from '@/lib/api/lda'
import { checkSyncAuth } from '@/lib/auth/syncAuth'

const LDA_API_KEY = process.env.LDA_API_KEY

// Without a key: 15 req/min → ~4s between calls. With key: 120 req/min → ~0.5s.
// NB: each bill now costs TWO API calls (one per year of its Congress), so the
// effective request rate is double the per-bill rate.
// Measured: at 1100ms (~90 req/min) LDA still rate-limited ~65% of lookups,
// so the effective ceiling is well below the documented keyed 120/min. 2200ms
// (~55 req/min) trades throughput for lookups that actually succeed.
const DELAY_MS = LDA_API_KEY ? 2200 : 8200

export const maxDuration = 300

// Stop starting new bills past this point so the function returns a real result
// instead of being killed at maxDuration. Previously the route looped over ALL
// ~4,400 bills with no cursor and no budget: at 4.1s/bill that needs ~5 hours
// against a 300s ceiling, so it always died mid-run and every retry reprocessed
// the same first ~70 bills. It could never finish, which is why it was never
// scheduled. Now it's bounded and resumable via ?offset=.
const TIME_BUDGET_MS = 240_000

const CEREMONIAL = ['HRES', 'SRES', 'HCONRES', 'SCONRES']

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkSyncAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const { searchParams } = new URL(req.url)
  const offset = Math.max(Number(body.offset ?? searchParams.get('offset')) || 0, 0)
  const limit = Math.min(Math.max(Number(body.limit ?? searchParams.get('limit')) || 50, 1), 400)

  try {
    // Only bills we've never successfully checked (count IS NULL). Rate-limited
    // lookups are skipped rather than written, so without this filter every run
    // would restart at the same already-checked bills and re-skip them, and the
    // backlog would never drain. Ceremonial resolutions are excluded — they're
    // essentially never lobbied and would starve the bills users actually read.
    const where = { billType: { notIn: CEREMONIAL }, lobbyingFirmCount: null }
    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        select: { id: true, billType: true, billNumber: true, congress: true },
        orderBy: [{ latestActionDate: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ])

    let updated = 0
    let errors = 0
    let processed = 0
    let skipped = 0

    for (let i = 0; i < bills.length; i++) {
      if (Date.now() - started > TIME_BUDGET_MS) break
      const bill = bills[i]
      // Throttle between calls only — no trailing delay after the last bill.
      if (i > 0) await delay(DELAY_MS)
      try {
        const count = await getLobbyingFirmCount(bill.billType, bill.billNumber, bill.congress)
        if (count === null) {
          // Lookup failed (usually rate-limited) — leave the stored value alone.
          // Writing 0 here previously erased verified counts.
          skipped++
        } else {
          await prisma.bill.update({
            where: { id: bill.id },
            data: { lobbyingFirmCount: count },
          })
          updated++
        }
      } catch {
        errors++
      }
      processed++
    }

    const nextOffset = offset + processed
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      offset,
      processed,
      updated,
      skipped,
      errors,
      total,
      nextOffset: nextOffset < total ? nextOffset : null,
      elapsedMs: Date.now() - started,
    })
  } catch (e) {
    console.error('[sync-lobbying]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

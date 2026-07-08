// Pre-warms AI analysis (summary + pros/cons + impacts) for the most prominent
// bills that don't have a fresh analysis yet, so visitors land on an already-
// generated summary instead of waiting ~10-20s for the on-view auto-fire.
//
// Triggered by the daily GitHub Actions workflow (looped with a small batch
// size) or manually: POST /api/sync-summaries with Bearer CRON_SECRET.
//
// Each AIService.analyzeAndSaveBill() call makes one Claude (Haiku) request and
// can take 10-20s, so we process a small batch per invocation under a wall-clock
// budget and let the workflow loop until the backlog for the night is drained.
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkSyncAuth } from '@/lib/auth/syncAuth'

export const maxDuration = 60

// Ceremonial resolutions get effectively zero readership — don't spend Claude
// calls on them. Mirrors the sync-news targeting.
const CEREMONIAL = ['HRES', 'SRES', 'HCONRES', 'SCONRES']

// Stop *starting* a new analysis past this point so the function returns well
// under maxDuration even if the last call runs long.
const TIME_BUDGET_MS = 50_000

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkSyncAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const limit = Math.min(Math.max(Number(body.limit) || 4, 1), 10)

  const prominenceOrder = [
    { lobbyingFirmCount: { sort: 'desc' as const, nulls: 'last' as const } },
    { latestActionDate: { sort: 'desc' as const, nulls: 'last' as const } },
  ]

  // Two backlogs, in priority order:
  // 1. LEGACY-FORMAT summaries — bills analyzed before the structured
  //    TL;DR/Problem/Proposal/Impact format. These are the MOST prominent
  //    bills (earlier pre-warm did prominence-first), i.e. the pages users
  //    actually see, so reformatting them beats analyzing the long tail.
  //    They need force:true to bypass the freshness skip.
  // 2. Never-analyzed bills. (New bills are also covered on-demand by the
  //    on-view auto-fire, so deprioritizing them here loses nothing.)
  const legacyWhere = {
    aiAnalyzedAt: { not: null },
    NOT: { aiSummary: { startsWith: 'TL;DR:' } },
    billType: { notIn: CEREMONIAL },
  }
  const unanalyzedWhere = { aiAnalyzedAt: null, billType: { notIn: CEREMONIAL } }

  const legacy = await prisma.bill.findMany({
    where: legacyWhere, orderBy: prominenceOrder, take: limit, select: { id: true },
  })
  const fresh = legacy.length < limit
    ? await prisma.bill.findMany({
        where: unanalyzedWhere, orderBy: prominenceOrder,
        take: limit - legacy.length, select: { id: true },
      })
    : []

  const candidates = [
    ...legacy.map(b => ({ id: b.id, force: true })),
    ...fresh.map(b => ({ id: b.id, force: false })),
  ]

  const [legacyBacklog, unanalyzedBacklog] = await Promise.all([
    prisma.bill.count({ where: legacyWhere }),
    prisma.bill.count({ where: unanalyzedWhere }),
  ])

  const { AIService } = await import('@/lib/services/aiService')
  let processed = 0
  let failed = 0

  for (const bill of candidates) {
    if (Date.now() - started > TIME_BUDGET_MS) break
    try {
      await AIService.analyzeAndSaveBill(bill.id, { force: bill.force })
      processed++
    } catch (e) {
      failed++
      console.error(`[sync-summaries] ${bill.id} failed:`, (e as Error)?.message || e)
    }
  }

  return NextResponse.json({
    success: true,
    considered: candidates.length,
    processed,
    failed,
    // backlogs measured before this run
    legacyBacklog: Math.max(legacyBacklog - processed, 0),
    remaining: unanalyzedBacklog,
    elapsedMs: Date.now() - started,
  })
}

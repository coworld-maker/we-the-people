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

  // Most prominent bills still missing an analysis. lobbyingFirmCount surfaces
  // the bills journalists/lobbyists (and therefore citizens) care about; recency
  // breaks ties. Bills already analyzed are skipped here and re-checked for
  // staleness inside analyzeAndSaveBill.
  const candidates = await prisma.bill.findMany({
    where: {
      aiAnalyzedAt: null,
      billType: { notIn: CEREMONIAL },
    },
    orderBy: [
      { lobbyingFirmCount: { sort: 'desc', nulls: 'last' } },
      { latestActionDate: { sort: 'desc', nulls: 'last' } },
    ],
    take: limit,
    select: { id: true },
  })

  const remainingBacklog = await prisma.bill.count({
    where: { aiAnalyzedAt: null, billType: { notIn: CEREMONIAL } },
  })

  const { AIService } = await import('@/lib/services/aiService')
  let processed = 0
  let failed = 0

  for (const bill of candidates) {
    if (Date.now() - started > TIME_BUDGET_MS) break
    try {
      await AIService.analyzeAndSaveBill(bill.id)
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
    // backlog measured before this run; subtract what we just did for a hint
    remaining: Math.max(remainingBacklog - processed, 0),
    elapsedMs: Date.now() - started,
  })
}

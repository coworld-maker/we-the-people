// Syncs external press coverage for recently-active bills into BillNewsArticle.
// Triggered by cron or manually: POST /api/sync-news with Bearer CRON_SECRET.
//
// Time-budgeted: processes bills (newest first) via Newsdata until a wall-clock
// budget is hit, then returns JSON with a cursor — so it always responds well
// under the function limit (no 504s). GDELT is skipped here (it 429s from
// Vercel's shared IPs). Page renders read stored rows; never hit providers live.
// Trusted, lean-labeled outlets only (per fetchBillNewsFromProviders).
//
// Pass ?offset=N to resume from a later point; the response returns nextOffset
// when more recently-active bills remain to process.

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { fetchBillNewsFromProviders } from '@/lib/api/news'

export const maxDuration = 60 // safe on every plan tier

const CRON_SECRET = process.env.CRON_SECRET

// Polite spacing for Newsdata between bills.
const DELAY_MS = 600
// Stop and return before the function limit no matter what.
const TIME_BUDGET_MS = 45_000
// Upper bound on bills considered per run (the time budget is the real guard).
const MAX_BILLS = 120
const ACTIVE_DAYS = 45

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const secretHeader = req.headers.get('x-sync-secret')
  return authHeader === `Bearer ${CRON_SECRET}` || secretHeader === CRON_SECRET
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const offset = Math.max(0, parseInt(new URL(req.url).searchParams.get('offset') || '0', 10) || 0)
  const since = new Date(Date.now() - ACTIVE_DAYS * 24 * 60 * 60 * 1000)
  const bills = await prisma.bill.findMany({
    where: { latestActionDate: { gte: since } },
    orderBy: { latestActionDate: 'desc' },
    skip: offset,
    take: MAX_BILLS,
    select: { id: true, billType: true, billNumber: true, shortTitle: true, title: true },
  })

  const start = Date.now()
  let processed = 0
  let billsWithNews = 0
  let articlesStored = 0
  let errors = 0
  let timedOut = false

  for (const bill of bills) {
    if (Date.now() - start > TIME_BUDGET_MS) { timedOut = true; break }
    processed++
    try {
      const query = bill.shortTitle || bill.title
      const billCode = `${bill.billType} ${bill.billNumber}`
      const articles = await fetchBillNewsFromProviders(query, billCode, { skipGdelt: true })

      if (articles.length > 0) {
        billsWithNews++
        for (const a of articles) {
          try {
            await (prisma as any).billNewsArticle.upsert({
              where: { url: a.url },
              create: {
                billId: bill.id, url: a.url, title: a.title,
                source: a.source, lean: a.lean, publishedAt: new Date(a.publishedAt),
              },
              update: { title: a.title, source: a.source, lean: a.lean },
            })
            articlesStored++
          } catch { /* dup url across bills — skip */ }
        }
      }
    } catch {
      errors++
    }
    await delay(DELAY_MS)
  }

  // Prune coverage older than 120 days to keep the feed fresh
  const cutoff = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
  const pruned = await (prisma as any).billNewsArticle.deleteMany({
    where: { publishedAt: { lt: cutoff } },
  })

  // More to do if we filled the batch or ran out of time before finishing it
  const moreRemain = timedOut || bills.length === MAX_BILLS
  const nextOffset = moreRemain ? offset + processed : null

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    billsProcessed: processed,
    billsWithNews,
    articlesStored,
    pruned: pruned.count,
    errors,
    timedOut,
    nextOffset,
  })
}

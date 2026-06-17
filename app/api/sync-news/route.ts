// Syncs external press coverage for recently-active bills into BillNewsArticle.
// Triggered by cron or manually: POST /api/sync-news with Bearer CRON_SECRET.
//
// Runs sequentially with a delay between bills to respect GDELT's 1-req/5s
// limit. Page renders read the stored rows (instant) — they never hit the
// providers live. Trusted, lean-labeled outlets only (per fetchBillNewsFromProviders).

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { fetchBillNewsFromProviders } from '@/lib/api/news'

export const maxDuration = 300 // seconds — sequential GDELT pacing needs headroom

const CRON_SECRET = process.env.CRON_SECRET

// GDELT rate-limits to 1 req / 5s per IP — stay just over that.
const DELAY_MS = 5500
// Cap per run so the job stays within the 300s function budget
// (30 bills × 5.5s ≈ 165s). The daily cadence covers the active set over time.
const MAX_BILLS = 30
// Only sync bills active in this window (news exists for recent activity).
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

  const since = new Date(Date.now() - ACTIVE_DAYS * 24 * 60 * 60 * 1000)
  const bills = await prisma.bill.findMany({
    where: { latestActionDate: { gte: since } },
    orderBy: { latestActionDate: 'desc' },
    take: MAX_BILLS,
    select: { id: true, billType: true, billNumber: true, shortTitle: true, title: true },
  })

  let billsWithNews = 0
  let articlesStored = 0
  let errors = 0

  for (const bill of bills) {
    try {
      const query = bill.shortTitle || bill.title
      const billCode = `${bill.billType} ${bill.billNumber}`
      const articles = await fetchBillNewsFromProviders(query, billCode)

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

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    billsProcessed: bills.length,
    billsWithNews,
    articlesStored,
    pruned: pruned.count,
    errors,
  })
}

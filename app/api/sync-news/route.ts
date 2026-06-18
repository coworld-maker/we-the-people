// Syncs congressional press coverage into BillNewsArticle from curated, balanced
// RSS feeds (see lib/api/rss.ts). Lean labels are trustworthy by construction.
// Triggered by cron or manually: POST /api/sync-news with Bearer CRON_SECRET.
//
// Articles are stored as general congressional coverage (billId = null) and
// additionally linked to a specific bill when the article text cites a bill
// code (e.g. "HR 1234"). The /news page shows the full pool; bill-page cards
// show only the linked ones. Page renders read the DB; never hit feeds live.

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCongressionalNewsFromRss } from '@/lib/api/rss'
import { getNewsdataCongressional } from '@/lib/api/news'
import { billCodeKeys } from '@/lib/news-match'

export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const secretHeader = req.headers.get('x-sync-secret')
  return authHeader === `Bearer ${CRON_SECRET}` || secretHeader === CRON_SECRET
}

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Pull balanced congressional coverage. RSS is primary (free, reliable,
  //    balanced by construction); Newsdata is a backup/supplement that keeps
  //    the feed alive if feeds fail. Merge, RSS winning on duplicate URLs.
  const [rss, newsdata] = await Promise.all([
    getCongressionalNewsFromRss(14),
    getNewsdataCongressional(14),
  ])
  const seenUrls = new Set<string>()
  const articles = [...rss, ...newsdata].filter(a => {
    if (seenUrls.has(a.url)) return false
    seenUrls.add(a.url)
    return true
  })

  // Health floor: a healthy run pulls dozens of articles. A low count means
  // feeds are failing — surface it in logs (response also reports the counts).
  const FLOOR = 20
  if (articles.length < FLOOR) {
    console.error(`[sync-news] LOW YIELD: ${articles.length} articles (rss=${rss.length}, newsdata=${newsdata.length}) — feeds may be failing`)
  }

  // 2. Build a bill-code → id map for linking (cheap: ~2.5k rows)
  const bills = await prisma.bill.findMany({
    select: { id: true, billType: true, billNumber: true },
  })
  const byCode = new Map<string, string>()
  for (const b of bills) byCode.set(`${b.billType.toUpperCase()}${b.billNumber}`, b.id)

  let stored = 0
  let linked = 0
  let errors = 0

  for (const a of articles) {
    // Link to the first cited bill we recognize, else store as general (null)
    const codes = billCodeKeys(`${a.title} ${a.description ?? ''}`)
    const billId = codes.map(c => byCode.get(c)).find(Boolean) ?? null
    if (billId) linked++

    try {
      await (prisma as any).billNewsArticle.upsert({
        where: { url: a.url },
        create: {
          billId, url: a.url, title: a.title,
          source: a.source, lean: a.lean, publishedAt: new Date(a.publishedAt),
        },
        update: { billId, title: a.title, source: a.source, lean: a.lean },
      })
      stored++
    } catch {
      errors++
    }
  }

  // Prune coverage older than 30 days (RSS is a rolling window)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const pruned = await (prisma as any).billNewsArticle.deleteMany({
    where: { publishedAt: { lt: cutoff } },
  })

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    articlesFetched: articles.length,
    fromRss: rss.length,
    fromNewsdata: newsdata.length,
    stored,
    linkedToBills: linked,
    pruned: pruned.count,
    errors,
  })
}

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
import { checkSyncAuth } from '@/lib/auth/syncAuth'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkSyncAuth(req)) {
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

  // 2. Build lookup maps for linking (cheap: ~3k rows)
  const bills = await prisma.bill.findMany({
    select: { id: true, billType: true, billNumber: true, congress: true, shortTitle: true },
    // Ascending congress so the newest Congress overwrites older entries below:
    // bill numbers restart each Congress, so "H.R. 1234" is ambiguous and the
    // current Congress is what a news article almost certainly means.
    orderBy: { congress: 'asc' },
  })
  const byCode = new Map<string, string>()
  const byTitle: Array<{ title: string; id: string }> = []
  for (const b of bills) {
    byCode.set(`${b.billType.toUpperCase()}${b.billNumber}`, b.id)
    // Most coverage names a bill ("the Epstein Files Transparency Act"), never
    // its number — only 3 of 1,479 stored articles contained a bill code, so
    // code-matching alone left the per-bill news card empty on every page.
    // NB: shortTitle is currently null for every row, so `title` is what
    // actually carries the popular name; prefer shortTitle if it's ever synced.
    // The length floor keeps short/generic names ("DLARA") from false-matching,
    // and a full-phrase containment match is strong evidence of relevance.
    const t = (b.shortTitle ?? b.title)?.trim()
    if (t && t.length >= 18) byTitle.push({ title: t.toLowerCase(), id: b.id })
  }
  // Longest first so "American Music Fairness Act" wins over "Fairness Act".
  byTitle.sort((a, b) => b.title.length - a.title.length)

  let stored = 0
  let linked = 0
  let errors = 0

  for (const a of articles) {
    // Link to the first cited bill we recognize, else store as general (null).
    // Bill code is the stronger signal, so try it before the title match.
    const haystack = `${a.title} ${a.description ?? ''}`
    const codes = billCodeKeys(haystack)
    let billId = codes.map(c => byCode.get(c)).find(Boolean) ?? null
    if (!billId) {
      const lower = haystack.toLowerCase()
      billId = byTitle.find(t => lower.includes(t.title))?.id ?? null
    }
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

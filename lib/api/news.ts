/**
 * Per-bill news — external coverage attached to a specific bill.
 *
 * Council scope: attach + LABEL, never editorially curate. Each article carries
 * its source's political lean (AllSides-style) so the spread is visibly balanced.
 *
 * Two providers, merged + deduped:
 *   - Newsdata.io (NEWSDATA_API_KEY) — cleaner, politics-categorized
 *   - GDELT DOC 2.0 — no key, free for production, broad source coverage
 * Either can be absent; GDELT alone keeps the feed alive with no config.
 *
 * Hard relevance gate: results are kept ONLY if they reference the specific
 * bill AND congressional context — so the card never fills with generic news.
 */

export type Lean = 'left' | 'center' | 'right' | 'unknown'

export interface NewsArticle {
  title: string
  url: string
  source: string
  lean: Lean
  publishedAt: string
  description: string | null
}

// Outlet directory keyed by domain → display name + lean.
const OUTLETS: Record<string, { name: string; lean: Lean }> = {
  'reuters.com':        { name: 'Reuters',             lean: 'center' },
  'apnews.com':         { name: 'AP',                  lean: 'center' },
  'bbc.com':            { name: 'BBC',                 lean: 'center' },
  'bbc.co.uk':          { name: 'BBC',                 lean: 'center' },
  'axios.com':          { name: 'Axios',               lean: 'center' },
  'thehill.com':        { name: 'The Hill',            lean: 'center' },
  'usatoday.com':       { name: 'USA Today',           lean: 'center' },
  'bloomberg.com':      { name: 'Bloomberg',           lean: 'center' },
  'cspan.org':          { name: 'C-SPAN',              lean: 'center' },
  'pbs.org':            { name: 'PBS',                 lean: 'center' },
  'npr.org':            { name: 'NPR',                 lean: 'left' },
  'nytimes.com':        { name: 'New York Times',      lean: 'left' },
  'washingtonpost.com': { name: 'Washington Post',     lean: 'left' },
  'cnn.com':            { name: 'CNN',                 lean: 'left' },
  'msnbc.com':          { name: 'MSNBC',               lean: 'left' },
  'politico.com':       { name: 'Politico',            lean: 'left' },
  'theguardian.com':    { name: 'The Guardian',        lean: 'left' },
  'vox.com':            { name: 'Vox',                 lean: 'left' },
  'theatlantic.com':    { name: 'The Atlantic',        lean: 'left' },
  'abcnews.go.com':     { name: 'ABC News',            lean: 'left' },
  'cbsnews.com':        { name: 'CBS News',            lean: 'left' },
  'nbcnews.com':        { name: 'NBC News',            lean: 'left' },
  'time.com':           { name: 'Time',                lean: 'left' },
  'foxnews.com':        { name: 'Fox News',            lean: 'right' },
  'wsj.com':            { name: 'Wall Street Journal', lean: 'right' },
  'nypost.com':         { name: 'New York Post',       lean: 'right' },
  'nationalreview.com': { name: 'National Review',     lean: 'right' },
  'washingtontimes.com':{ name: 'Washington Times',    lean: 'right' },
  'washingtonexaminer.com': { name: 'Washington Examiner', lean: 'right' },
  'dailywire.com':      { name: 'The Daily Wire',      lean: 'right' },
  'newsmax.com':        { name: 'Newsmax',             lean: 'right' },
  'breitbart.com':      { name: 'Breitbart',           lean: 'right' },
  'thefederalist.com':  { name: 'The Federalist',      lean: 'right' },
  'reason.com':         { name: 'Reason',              lean: 'right' },
  'rollcall.com':       { name: 'Roll Call',           lean: 'center' },
  'realclearpolitics.com': { name: 'RealClearPolitics', lean: 'center' },
  'newsweek.com':       { name: 'Newsweek',            lean: 'center' },
  'semafor.com':        { name: 'Semafor',             lean: 'center' },
  'cnbc.com':           { name: 'CNBC',                lean: 'center' },
  'forbes.com':         { name: 'Forbes',              lean: 'center' },
  'marketwatch.com':    { name: 'MarketWatch',         lean: 'center' },
  'huffpost.com':       { name: 'HuffPost',            lean: 'left' },
  'motherjones.com':    { name: 'Mother Jones',        lean: 'left' },
  'slate.com':          { name: 'Slate',               lean: 'left' },
  'salon.com':          { name: 'Salon',               lean: 'left' },
  'thedailybeast.com':  { name: 'The Daily Beast',     lean: 'left' },
  'newrepublic.com':    { name: 'The New Republic',    lean: 'left' },
  'businessinsider.com':{ name: 'Business Insider',    lean: 'left' },
  'townhall.com':       { name: 'Townhall',            lean: 'right' },
  'dailycaller.com':    { name: 'The Daily Caller',    lean: 'right' },
  'freebeacon.com':     { name: 'Washington Free Beacon', lean: 'right' },
  'thedispatch.com':    { name: 'The Dispatch',        lean: 'right' },
  'spectator.org':      { name: 'The American Spectator', lean: 'right' },
  'justthenews.com':    { name: 'Just the News',       lean: 'right' },
}

function hostOf(urlOrDomain: string): string {
  try {
    const h = urlOrDomain.includes('://') ? new URL(urlOrDomain).hostname : urlOrDomain
    return h.replace(/^www\./, '').toLowerCase()
  } catch {
    return urlOrDomain.replace(/^www\./, '').toLowerCase()
  }
}

function outletFor(domain: string): { name: string; lean: Lean } {
  const host = hostOf(domain)
  if (OUTLETS[host]) return OUTLETS[host]
  // Match on registrable-ish suffix (e.g. edition.cnn.com → cnn.com)
  for (const key of Object.keys(OUTLETS)) {
    if (host === key || host.endsWith('.' + key)) return OUTLETS[key]
  }
  const pretty = host.split('.').slice(0, -1).join('.') || host
  return { name: pretty, lean: 'unknown' }
}

// ── Congressional relevance gate ─────────────────────────────────────────────
const CONGRESS_TERMS = [
  'congress', 'congressional', 'senate', 'senator', 'house of representatives',
  'representative', 'lawmaker', 'legislation', 'legislative', 'capitol hill',
  'bill', 'filibuster', 'committee', 'floor vote', 'roll call',
]
const STOPWORDS = new Set([
  'act', 'of', 'the', 'and', 'to', 'a', 'for', 'in', 'on', 'with', 'an',
  '2023', '2024', '2025', '2026', 'bill', 'resolution',
])

function billCodeVariants(billCode: string): string[] {
  const compact = billCode.toLowerCase().replace(/[.\s]/g, '') // "hr9062"
  const spaced = billCode.toLowerCase()                        // "hr 9062"
  const dotted = spaced.replace(/^([a-z]+)\s/, (_m, p) => p.split('').join('.') + '. ') // "h.r. 9062"
  return Array.from(new Set([compact, spaced, dotted]))
}

/** Distinctive multi-word phrase from the bill title (drops generic words). */
function titleKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
}

/**
 * Compact search term for the providers. A bill's full official title is a
 * long sentence that never matches journalist framing as an exact phrase, so
 * we send the distinctive keywords instead and let the post-filter enforce
 * precision. Short titles (≤6 words) are used as-is.
 */
function searchTerms(query: string): string {
  const words = query.trim().split(/\s+/)
  if (words.length <= 6) return query.trim()
  return titleKeywords(query).slice(0, 5).join(' ')
}

function isRelevant(text: string, billCode: string, title: string): boolean {
  const t = text.toLowerCase()
  const codeHit = billCodeVariants(billCode).some(v => t.includes(v))
  if (codeHit) return true // the bill number itself is unambiguously congressional

  const keys = titleKeywords(title)
  // Require at least 2 distinctive title words present AND a congressional term
  const keyHits = keys.filter(k => t.includes(k)).length
  const congressional = CONGRESS_TERMS.some(k => t.includes(k))
  return keyHits >= 2 && congressional
}

function dedupe(articles: NewsArticle[]): NewsArticle[] {
  const seenUrl = new Set<string>()
  const seenTitle = new Set<string>()
  const out: NewsArticle[] = []
  for (const a of articles) {
    const tkey = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)
    if (seenUrl.has(a.url) || seenTitle.has(tkey)) continue
    seenUrl.add(a.url); seenTitle.add(tkey)
    out.push(a)
  }
  return out
}

/** Center/wire first, then interleave left & right so the top is never one-sided. */
function balance<T extends { lean: Lean }>(articles: T[]): T[] {
  const center = articles.filter(a => a.lean === 'center' || a.lean === 'unknown')
  const left = articles.filter(a => a.lean === 'left')
  const right = articles.filter(a => a.lean === 'right')
  const out: T[] = [...center.slice(0, 2)]
  const max = Math.max(left.length, right.length)
  for (let i = 0; i < max; i++) {
    if (left[i]) out.push(left[i])
    if (right[i]) out.push(right[i])
  }
  out.push(...center.slice(2))
  return out
}

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

// ── Providers ────────────────────────────────────────────────────────────────

async function fromNewsdata(query: string, billCode: string): Promise<NewsArticle[]> {
  const key = process.env.NEWSDATA_API_KEY
  if (!key) return []
  // Distinctive keywords (not the full title sentence) + bill code; the
  // post-filter enforces precision. US politics only.
  const q = `"${billCode}" OR ${searchTerms(query)}`
  const url = `https://newsdata.io/api/1/latest?apikey=${key}&q=${encodeURIComponent(q)}&language=en&country=us&category=politics`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) { console.error('[news] newsdata error:', res.status); return [] }
    const data = await res.json()
    return (data.results || []).map((r: any): NewsArticle => {
      const domain = r.source_url || r.link || ''
      const o = outletFor(domain)
      return {
        title: r.title,
        url: r.link,
        source: o.name,
        lean: o.lean,
        publishedAt: r.pubDate ? new Date(r.pubDate).toISOString() : new Date().toISOString(),
        description: r.description ?? null,
      }
    })
  } catch (e) {
    console.error('[news] newsdata fetch failed:', e)
    return []
  }
}

async function fromGdelt(query: string, billCode: string): Promise<NewsArticle[]> {
  // GDELT query language: space = AND, OR uppercase, quotes for phrases.
  const q = `("${billCode}" OR "${searchTerms(query)}") (Congress OR Senate OR House OR legislation) sourcelang:english`
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&format=json&maxrecords=30&sort=DateDesc`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) { console.error('[news] gdelt error:', res.status); return [] }
    const data = await res.json().catch(() => ({}))
    return (data.articles || []).map((a: any): NewsArticle => {
      const o = outletFor(a.domain || a.url || '')
      // GDELT seendate: YYYYMMDDTHHMMSSZ
      let iso = new Date().toISOString()
      if (typeof a.seendate === 'string' && a.seendate.length >= 15) {
        const s = a.seendate
        iso = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`
      }
      return {
        title: a.title,
        url: a.url,
        source: o.name,
        lean: o.lean,
        publishedAt: iso,
        description: null,
      }
    })
  } catch (e) {
    console.error('[news] gdelt fetch failed:', e)
    return []
  }
}

// ── Public ───────────────────────────────────────────────────────────────────

/**
 * Live fetch from both providers + filter. Used by the daily sync job, NOT by
 * page renders (page renders read the synced DB rows via getStoredNewsForBill).
 */
export async function fetchBillNewsFromProviders(
  query: string,
  billCode: string,
  opts: { skipGdelt?: boolean } = {},
): Promise<NewsArticle[]> {
  // GDELT rate-limits to 1 req/5s per IP and reliably 429s from Vercel's
  // shared egress IPs during a bulk sync — skip it there; Newsdata carries it.
  const providers = opts.skipGdelt
    ? [fromNewsdata(query, billCode)]
    : [fromNewsdata(query, billCode), fromGdelt(query, billCode)]
  const results = await Promise.allSettled(providers)
  const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

  const cutoff = Date.now() - NINETY_DAYS
  const filtered = all.filter(a => {
    if (!a.title || !a.url || a.title === '[Removed]') return false
    if (new Date(a.publishedAt).getTime() < cutoff) return false
    // Recognized outlets only — guarantees a real lean label and filters out
    // the obscure local blogs the free tiers surface. The whole value prop is
    // a *labeled, balanced* spread, so unlabeled sources don't belong.
    if (a.lean === 'unknown') return false
    // Hard congressional + bill relevance gate
    return isRelevant(`${a.title} ${a.description ?? ''}`, billCode, query)
  })

  return balance(dedupe(filtered)).slice(0, 8)
}

// ── DB reads (what page renders use) ─────────────────────────────────────────
import prisma from '@/lib/prisma'

interface StoredArticle {
  title: string; url: string; source: string; lean: Lean
  publishedAt: string; billId: string | null
}

function rowToArticle(r: any): StoredArticle {
  return {
    title: r.title, url: r.url, source: r.source, lean: r.lean as Lean,
    publishedAt: (r.publishedAt instanceof Date ? r.publishedAt : new Date(r.publishedAt)).toISOString(),
    billId: r.billId,
  }
}

/** Synced coverage for a single bill (used by the bill-page card). */
export async function getStoredNewsForBill(billId: string, limit = 6): Promise<StoredArticle[]> {
  const rows = await (prisma as any).billNewsArticle.findMany({
    where: { billId },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
  return balance(rows.map(rowToArticle))
}

export interface FeedArticle extends StoredArticle {
  bill: { id: string; code: string; title: string } | null
}

/** Most recent coverage across all bills (used by the dedicated News page),
 *  each joined to its bill for linking. */
export async function getRecentNews(limit = 40): Promise<FeedArticle[]> {
  const rows = await (prisma as any).billNewsArticle.findMany({
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
  const billIds = Array.from(new Set(rows.map((r: any) => r.billId).filter(Boolean)))
  const bills = await prisma.bill.findMany({
    where: { id: { in: billIds as string[] } },
    select: { id: true, billType: true, billNumber: true, shortTitle: true, title: true },
  })
  const byId = new Map(bills.map(b => [b.id, b]))
  return rows.map((r: any): FeedArticle => {
    const b = byId.get(r.billId)
    return {
      ...rowToArticle(r),
      bill: b ? { id: b.id, code: `${b.billType} ${b.billNumber}`, title: b.shortTitle || b.title } : null,
    }
  })
}

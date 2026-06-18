/**
 * Curated RSS ingestion — the news input. Instead of a search API (sparse,
 * rate-limited, aggregator-heavy), we pull from a hand-picked, balanced set of
 * major outlets' politics feeds. Lean labels are trustworthy *by construction*
 * (we chose the outlets), the feed is always full, and it's free with no keys
 * or rate limits.
 *
 * Returns only congressionally-relevant items. Bill association happens in the
 * sync job (it has DB access); this module is pure fetch + parse + label.
 */

import { type Lean, type NewsArticle } from './news'

interface Feed { url: string; name: string; lean: Lean }

// Balanced across the spectrum. Per-feed failures are tolerated by the caller.
const FEEDS: Feed[] = [
  // Center / wire
  { url: 'https://thehill.com/news/feed/',                         name: 'The Hill',              lean: 'center' },
  { url: 'https://api.axios.com/feed/',                            name: 'Axios',                 lean: 'center' },
  { url: 'https://www.realclearpolitics.com/index.xml',            name: 'RealClearPolitics',     lean: 'center' },
  { url: 'https://feeds.npr.org/1014/rss.xml',                     name: 'NPR',                   lean: 'left' },
  // Left
  { url: 'https://rss.politico.com/congress.xml',                  name: 'Politico',              lean: 'left' },
  { url: 'https://feeds.nbcnews.com/nbcnews/public/politics',      name: 'NBC News',              lean: 'left' },
  { url: 'https://www.cbsnews.com/latest/rss/politics',            name: 'CBS News',              lean: 'left' },
  { url: 'https://www.theguardian.com/us-news/us-politics/rss',    name: 'The Guardian',          lean: 'left' },
  // Right
  { url: 'https://moxie.foxnews.com/google-publisher/politics.xml', name: 'Fox News',             lean: 'right' },
  { url: 'https://www.washingtonexaminer.com/feed/',              name: 'Washington Examiner',   lean: 'right' },
  { url: 'https://www.nationalreview.com/feed/',                   name: 'National Review',       lean: 'right' },
  { url: 'https://thedispatch.com/feed/',                          name: 'The Dispatch',          lean: 'right' },
  { url: 'https://www.washingtontimes.com/rss/headlines/news/politics/', name: 'Washington Times', lean: 'right' },
  { url: 'https://dailycaller.com/feed/',                          name: 'The Daily Caller',      lean: 'right' },
]

const CONGRESS_TERMS = [
  'congress', 'congressional', 'senate', 'senator', 'house of representatives',
  'representative', 'lawmaker', 'legislation', 'legislative', 'capitol hill',
  ' bill ', 'filibuster', 'committee', 'floor vote', 'roll call', 'house gop',
  'house democrat', 'house republican', 'speaker of the house', 'appropriations',
]

function isCongressional(text: string): boolean {
  const t = ` ${text.toLowerCase()} `
  return CONGRESS_TERMS.some(k => t.includes(k))
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')        // strip any inline HTML
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#0?34;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .trim()
}

function firstTag(block: string, names: string[]): string | null {
  for (const name of names) {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
    if (m && m[1].trim()) return decode(m[1])
  }
  return null
}

function extractLink(block: string): string | null {
  // RSS: <link>URL</link>
  const rss = block.match(/<link>([\s\S]*?)<\/link>/i)
  if (rss && rss[1].trim()) return decode(rss[1])
  // Atom: <link href="URL" .../>
  const atom = block.match(/<link[^>]*href="([^"]+)"/i)
  if (atom) return atom[1]
  return null
}

async function parseFeed(feed: Feed): Promise<NewsArticle[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'DemocracyUnlocked/1.0 (+https://www.democracyunlocked.com)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      console.warn(`[rss] feed unhealthy: ${feed.name} (${feed.url}) → HTTP ${res.status}`)
      return []
    }
    const xml = await res.text()
    return parseRssDocument(xml, feed)
  } catch {
    return []
  }
}

/**
 * Pure RSS/Atom → NewsArticle[] parser (no network) — exported for unit tests.
 * Keeps only congressionally-relevant items; labels with the feed's lean.
 */
export function parseRssDocument(xml: string, feed: { name: string; lean: Lean }): NewsArticle[] {
  // Split into <item> (RSS) or <entry> (Atom) blocks
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1).map(b => '<item ' + b)
  const items = itemBlocks.length > 0
    ? itemBlocks
    : xml.split(/<entry[\s>]/i).slice(1).map(b => '<entry ' + b)

  const out: NewsArticle[] = []
  for (const raw of items.slice(0, 40)) {
    const block = raw.split(/<\/(item|entry)>/i)[0]
    const title = firstTag(block, ['title'])
    const url = extractLink(block)
    const desc = firstTag(block, ['description', 'summary', 'content:encoded'])
    const dateStr = firstTag(block, ['pubDate', 'published', 'updated', 'dc:date'])
    if (!title || !url) continue
    if (!isCongressional(`${title} ${desc ?? ''}`)) continue
    const publishedAt = dateStr ? new Date(dateStr) : new Date()
    out.push({
      title,
      url,
      source: feed.name,
      lean: feed.lean,
      publishedAt: isNaN(publishedAt.getTime()) ? new Date().toISOString() : publishedAt.toISOString(),
      description: desc ? desc.slice(0, 300) : null,
    })
  }
  return out
}

/** All congressionally-relevant articles from the curated feeds, recent first. */
export async function getCongressionalNewsFromRss(daysBack = 14): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(FEEDS.map(parseFeed))
  const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

  // Feed-health surfacing: warn when feeds go dark so silent rot is visible.
  const empty = FEEDS.filter((_, i) => {
    const r = results[i]
    return r.status === 'rejected' || r.value.length === 0
  }).map(f => f.name)
  const healthy = FEEDS.length - empty.length
  if (empty.length > 0) console.warn(`[rss] ${empty.length}/${FEEDS.length} feeds returned nothing: ${empty.join(', ')}`)
  if (healthy < FEEDS.length / 2) console.error(`[rss] FEED HEALTH LOW: only ${healthy}/${FEEDS.length} feeds healthy — check lib/api/rss.ts FEEDS`)

  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000
  const seen = new Set<string>()
  const fresh = all.filter(a => {
    if (new Date(a.publishedAt).getTime() < cutoff) return false
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })
  fresh.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
  return fresh
}

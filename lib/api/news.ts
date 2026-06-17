/**
 * Per-bill news — external coverage attached to a specific bill.
 *
 * Council scope: news is attached + LABELED, never editorially curated. Each
 * article carries its source's political lean (AllSides-style) so users see a
 * balanced spread rather than a feed we hand-pick. Bias liability lives in
 * curation; we don't curate.
 *
 * Backed by NewsAPI.org (NEWS_API_KEY). Degrades to [] when the key is absent
 * so bill pages render fine without it.
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

// AllSides / Ad Fontes-informed lean map for common national outlets.
// Center includes wire services we prefer to surface first.
const LEAN_MAP: Record<string, Lean> = {
  'reuters': 'center', 'associated press': 'center', 'ap news': 'center',
  'bbc news': 'center', 'bbc': 'center', 'c-span': 'center', 'axios': 'center',
  'the hill': 'center', 'usa today': 'center', 'bloomberg': 'center',
  'npr': 'left', 'the new york times': 'left', 'the washington post': 'left',
  'cnn': 'left', 'msnbc': 'left', 'politico': 'left', 'the guardian': 'left',
  'vox': 'left', 'the atlantic': 'left', 'abc news': 'left', 'cbs news': 'left',
  'nbc news': 'left', 'time': 'left',
  'fox news': 'right', 'the wall street journal': 'right', 'new york post': 'right',
  'national review': 'right', 'the washington times': 'right', 'washington examiner': 'right',
  'the daily wire': 'right', 'newsmax': 'right', 'breitbart': 'right',
  'the federalist': 'right', 'reason': 'right',
}

function leanFor(source: string): Lean {
  return LEAN_MAP[source.trim().toLowerCase()] ?? 'unknown'
}

/**
 * Order results for balance: center/wire first, then interleave left & right
 * so the top of the list is never single-lean. Within a lean, newest first.
 */
function balance(articles: NewsArticle[]): NewsArticle[] {
  const center = articles.filter(a => a.lean === 'center' || a.lean === 'unknown')
  const left = articles.filter(a => a.lean === 'left')
  const right = articles.filter(a => a.lean === 'right')
  const out: NewsArticle[] = [...center.slice(0, 2)]
  const max = Math.max(left.length, right.length)
  for (let i = 0; i < max; i++) {
    if (left[i]) out.push(left[i])
    if (right[i]) out.push(right[i])
  }
  out.push(...center.slice(2))
  return out
}

export async function getBillNews(query: string, billCode: string): Promise<NewsArticle[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) return []

  // Search the bill's plain title plus its code (e.g. "HR 9062"); quote the
  // code so it isn't tokenized. Restrict to last 90 days, English.
  const q = `("${billCode}" OR ${JSON.stringify(query)})`
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${since}&language=en&sortBy=relevancy&pageSize=20&apiKey=${key}`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      console.error('[news] NewsAPI error:', res.status)
      return []
    }
    const data = await res.json()
    const seen = new Set<string>()
    const articles: NewsArticle[] = (data.articles || [])
      .map((a: any): NewsArticle => ({
        title: a.title,
        url: a.url,
        source: a.source?.name ?? 'Unknown',
        lean: leanFor(a.source?.name ?? ''),
        publishedAt: a.publishedAt,
        description: a.description ?? null,
      }))
      .filter((a: NewsArticle) => {
        if (!a.title || !a.url || a.title === '[Removed]') return false
        if (seen.has(a.url)) return false
        seen.add(a.url)
        return true
      })

    return balance(articles).slice(0, 8)
  } catch (e) {
    console.error('[news] fetch error:', e)
    return []
  }
}

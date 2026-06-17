/**
 * Dashboard news teaser — surfaces the latest synced press coverage on Home so
 * the news feature isn't an island at /news. Renders nothing until the sync
 * has populated coverage.
 */

import Link from 'next/link'
import { getRecentNews } from '@/lib/api/news'
import { Newspaper, ArrowRight, ExternalLink } from 'lucide-react'

const LEAN_DOT: Record<string, string> = {
  left: 'bg-blue-500', center: 'bg-[--text-muted]', right: 'bg-red-500',
}

export default async function NewsTeaser() {
  const all = await getRecentNews(20)
  // De-dupe only among bill-linked items (avoid 3 takes on the same bill);
  // keep all general (unlinked) coverage.
  const seenBills = new Set<string>()
  const articles = all.filter(a => {
    if (!a.bill) return true
    if (seenBills.has(a.bill.id)) return false
    seenBills.add(a.bill.id)
    return true
  }).slice(0, 4)
  if (articles.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[--accent]" />
          <h3 className="font-display text-sm font-bold text-[--text]">In the news</h3>
        </div>
        <Link href="/news" className="text-xs font-semibold text-[--accent] hover:underline flex items-center gap-1">
          All news <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-[--border]">
        {articles.map(a => (
          <div key={a.url} className="px-6 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${LEAN_DOT[a.lean] ?? 'bg-[--text-muted]'}`} />
              <span className="text-[11px] font-medium text-[--text-muted]">{a.source}</span>
            </div>
            <a href={a.url} target="_blank" rel="noopener noreferrer"
              className="group text-sm font-medium text-[--text] leading-snug hover:text-[--accent] transition-colors flex items-start gap-1">
              {a.title}
              <ExternalLink className="w-3 h-3 mt-1 shrink-0 opacity-50" />
            </a>
            {a.bill && (
              <Link href={`/bills/${a.bill.id}`}
                className="mt-1 inline-block text-[11px] font-semibold text-[--text-muted] hover:text-[--accent] transition-colors">
                {a.bill.code} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

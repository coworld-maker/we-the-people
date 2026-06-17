/**
 * Bill news card — external coverage of a specific bill, each item labeled
 * with its source's political lean so the spread is visibly balanced.
 * Server component; renders nothing when there's no coverage (or no API key).
 */

import { getStoredNewsForBill, type Lean } from '@/lib/api/news'
import { Newspaper, ExternalLink, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const LEAN_BADGE: Record<Lean, { label: string; cls: string }> = {
  left:    { label: 'Leans left',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  center:  { label: 'Center',      cls: 'bg-[--surface-secondary] text-[--text-secondary] border-[--border]' },
  right:   { label: 'Leans right', cls: 'bg-red-50 text-red-700 border-red-200' },
  unknown: { label: 'Source',      cls: 'bg-[--surface-secondary] text-[--text-muted] border-[--border]' },
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default async function BillNews({ billId }: { billId: string }) {
  const articles = await getStoredNewsForBill(billId)
  if (articles.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[--border] flex items-center gap-2">
        <Newspaper className="w-4 h-4 text-[--accent]" />
        <div>
          <h3 className="font-display text-sm font-bold text-[--text]">In the news</h3>
          <p className="text-xs text-[--text-muted]">Coverage of this bill, labeled by source lean</p>
        </div>
      </div>
      <div className="divide-y divide-[--border]">
        {articles.map(a => {
          const badge = LEAN_BADGE[a.lean]
          return (
            <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
              className="block px-5 py-3 hover:bg-[--surface-secondary] transition-colors group">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`badge border text-[10px] ${badge.cls}`}>{badge.label}</span>
                <span className="text-xs font-medium text-[--text-muted]">{a.source}</span>
                <span className="text-[10px] text-[--text-muted]">· {timeAgo(a.publishedAt)}</span>
              </div>
              <p className="text-sm font-medium text-[--text] leading-snug group-hover:text-[--accent] transition-colors flex items-start gap-1">
                {a.title}
                <ExternalLink className="w-3 h-3 mt-1 shrink-0 opacity-50" />
              </p>
            </a>
          )
        })}
      </div>
      <Link href="/news"
        className="flex items-center justify-center gap-1 px-5 py-3 border-t border-[--border] text-xs font-semibold text-[--accent] hover:bg-[--surface-secondary] transition-colors">
        All congressional news <ArrowRight className="w-3 h-3" />
      </Link>
      <p className="px-5 py-2.5 border-t border-[--border] text-[10px] text-[--text-muted]">
        Lean labels are source-level (AllSides-style), not article-level. Democracy Unlocked doesn’t curate or endorse coverage.
      </p>
    </div>
  )
}

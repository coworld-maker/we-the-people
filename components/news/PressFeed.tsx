'use client'

/**
 * Press coverage feed — aggregated external news across all bills, synced
 * daily into the DB. Lean-labeled and filterable so the spread is visibly
 * balanced. Each item links out to the article and back to its bill.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Newspaper, ExternalLink, FileText } from 'lucide-react'

type Lean = 'left' | 'center' | 'right'
interface Article {
  title: string; url: string; source: string; lean: Lean | 'unknown'
  publishedAt: string
  bill: { id: string; code: string; title: string } | null
}

const LEAN_BADGE: Record<string, { label: string; cls: string }> = {
  left:    { label: 'Leans left',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  center:  { label: 'Center',      cls: 'bg-[--surface-secondary] text-[--text-secondary] border-[--border]' },
  right:   { label: 'Leans right', cls: 'bg-red-50 text-red-700 border-red-200' },
  unknown: { label: 'Source',      cls: 'bg-[--surface-secondary] text-[--text-muted] border-[--border]' },
}

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'left',   label: 'Left' },
  { key: 'center', label: 'Center' },
  { key: 'right',  label: 'Right' },
] as const

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function PressFeed({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState<string>('all')

  const counts = {
    left: articles.filter(a => a.lean === 'left').length,
    center: articles.filter(a => a.lean === 'center').length,
    right: articles.filter(a => a.lean === 'right').length,
  }
  const shown = filter === 'all' ? articles : articles.filter(a => a.lean === filter)

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border]">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="w-5 h-5 text-[--accent]" />
          <h2 className="font-display text-base font-bold text-[--text]">In the news</h2>
        </div>
        <p className="text-xs text-[--text-muted]">
          Press coverage of bills in Congress, labeled by source lean. We attach and label — we don’t curate or endorse.
        </p>
        {/* Balance summary + filter */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {FILTERS.map(f => {
            const active = filter === f.key
            const n = f.key === 'all' ? articles.length : (counts as any)[f.key]
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                  active
                    ? 'bg-[--accent] text-white border-[--accent]'
                    : 'border-[--border] text-[--text-secondary] hover:text-[--text]'
                }`}>
                {f.label} <span className={active ? 'opacity-80' : 'text-[--text-muted]'}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Newspaper className="w-8 h-8 text-[--text-muted] mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-[--text]">No coverage yet</p>
          <p className="text-xs text-[--text-muted] mt-1">
            The daily news sync populates this as outlets cover active bills. Check back soon.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[--border]">
          {shown.map(a => {
            const badge = LEAN_BADGE[a.lean] ?? LEAN_BADGE.unknown
            return (
              <div key={a.url} className="px-6 py-3.5">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`badge border text-[10px] ${badge.cls}`}>{badge.label}</span>
                  <span className="text-xs font-medium text-[--text-muted]">{a.source}</span>
                  <span className="text-[10px] text-[--text-muted]">· {timeAgo(a.publishedAt)}</span>
                </div>
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="group text-sm font-medium text-[--text] leading-snug hover:text-[--accent] transition-colors flex items-start gap-1">
                  {a.title}
                  <ExternalLink className="w-3 h-3 mt-1 shrink-0 opacity-50" />
                </a>
                {a.bill && (
                  <Link href={`/bills/${a.bill.id}`}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-[--text-muted] hover:text-[--accent] transition-colors">
                    <FileText className="w-3 h-3" />
                    <span className="font-semibold">{a.bill.code}</span>
                    <span className="truncate max-w-[260px]">· {a.bill.title}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

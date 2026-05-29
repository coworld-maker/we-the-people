'use client'

import Link from 'next/link'
import { Vote, MessageSquare, Zap } from 'lucide-react'

interface FeedItem { id: string; type: string; emoji: string; text: string; billId: string; date: string; user: string }

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`
}

function ItemIcon({ type }: { type: string }) {
  if (type === 'vote')         return <Vote         className="w-3.5 h-3.5 text-[--accent] shrink-0" />
  if (type === 'rep_mismatch') return <Zap          className="w-3.5 h-3.5 text-amber-500 shrink-0" />
  return                              <MessageSquare className="w-3.5 h-3.5 text-purple-500 shrink-0" />
}

export default function ActivityFeed({ items }: { items: FeedItem[] }) {
  const mismatchItems  = items.filter(i => i.type === 'rep_mismatch')
  const communityItems = items.filter(i => i.type !== 'rep_mismatch')

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-[--success] rounded-full animate-pulse" />
        <h3 className="font-display text-sm font-bold text-[--text]">Platform activity</h3>
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-[--text-muted]">Activity will appear as citizens engage</p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">
          {mismatchItems.length > 0 && (
            <div className="border-b border-[--border]">
              <p className="px-6 pt-3 pb-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">Your rep voted differently</p>
              {mismatchItems.map(item => (
                <Link key={item.id} href={`/bills/${item.billId}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-amber-50/50 transition-colors border-b border-[--border] last:border-0"
                >
                  <ItemIcon type={item.type} />
                  <p className="text-sm text-[--text-secondary] flex-1 min-w-0 truncate">{item.text}</p>
                  <span className="text-xs text-[--text-muted] shrink-0">{timeAgo(item.date)}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="divide-y divide-[--border]">
            {communityItems.map(item => (
              <Link key={item.id} href={`/bills/${item.billId}`}
                className="flex items-center gap-3 px-6 py-3 hover:bg-[--surface-secondary] transition-colors"
              >
                <ItemIcon type={item.type} />
                <p className="text-sm text-[--text-secondary] flex-1 min-w-0 truncate">
                  <span className="font-semibold text-[--text]">{item.user}</span> {item.text}
                </p>
                <span className="text-xs text-[--text-muted] shrink-0">{timeAgo(item.date)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

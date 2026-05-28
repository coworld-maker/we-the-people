'use client'

import Link from 'next/link'
import { Vote, MessageSquare } from 'lucide-react'
import CollapsibleCard from '@/components/ui/CollapsibleCard'

interface FeedItem { id: string; type: string; emoji: string; text: string; billId: string; date: string; user: string }

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`
}

export default function ActivityFeed({ items }: { items: FeedItem[] }) {
  return (
    <CollapsibleCard
      storageKey="activity-feed"
      title="Platform activity"
      icon={<div className="w-1.5 h-1.5 bg-[--success] rounded-full animate-pulse" />}
    >
      {items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-[--text-muted]">Activity will appear as citizens engage</p>
        </div>
      ) : (
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[--border]">
          {items.map(item => (
            <Link key={item.id} href={`/bills/${item.billId}`}
              className="flex items-center gap-3 px-6 py-3 hover:bg-[--surface-secondary] transition-colors"
            >
              {item.type === 'vote'
                ? <Vote className="w-3.5 h-3.5 text-[--accent] shrink-0" />
                : <MessageSquare className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              }
              <p className="text-sm text-[--text-secondary] flex-1 min-w-0 truncate">
                <span className="font-semibold text-[--text]">{item.user}</span> {item.text}
              </p>
              <span className="text-xs text-[--text-muted] shrink-0">{timeAgo(item.date)}</span>
            </Link>
          ))}
        </div>
      )}
    </CollapsibleCard>
  )
}

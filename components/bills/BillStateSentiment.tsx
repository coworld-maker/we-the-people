'use client'

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import StateSentimentMap, { type StateBreakdown } from './StateSentimentMap'

interface SentimentResponse {
  byState: Record<string, StateBreakdown>
  totalVotes: number
  statesWithVotes: number
}

export default function BillStateSentiment({ billId }: { billId: string }) {
  const [data, setData] = useState<SentimentResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/bills/${billId}/state-sentiment`)
      .then(r => r.ok ? r.json() : null)
      .then(d => !cancelled && setData(d))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [billId])

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[--accent]" />
        <h3 className="font-display text-sm font-bold text-[--text] flex-1">Sentiment by state</h3>
        {data && data.statesWithVotes > 0 && (
          <span className="text-[10px] text-[--text-muted]">
            {data.statesWithVotes} {data.statesWithVotes === 1 ? 'state' : 'states'}
          </span>
        )}
      </div>
      <div className="p-4">
        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin" />
          </div>
        ) : (
          <StateSentimentMap
            byState={data?.byState ?? {}}
            totalVotes={data?.totalVotes ?? 0}
          />
        )}
      </div>
    </div>
  )
}

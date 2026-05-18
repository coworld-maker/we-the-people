'use client'

import { useEffect, useState } from 'react'
import { MapPin, Check, X, Minus, Users } from 'lucide-react'
import Link from 'next/link'

interface BillAlignment {
  billId: string
  billType: string
  billNumber: string
  billTitle: string
  memberPosition: string
  stateBreakdown: { yes: number; no: number; abstain: number; total: number }
  stateMajority: 'yes' | 'no' | 'tied'
  aligned: boolean | null
}

interface Response {
  stateCode: string
  alignmentPct: number | null
  matchedBills: number
  totalBills: number
  details: BillAlignment[]
}

export default function StateAlignmentCard({ bioguideId }: { bioguideId: string }) {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/scorecard/${bioguideId}/state-alignment`)
      .then(r => r.ok ? r.json() : null)
      .then(d => !cancelled && setData(d))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [bioguideId])

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[--accent]" />
          <h3 className="font-display text-sm font-bold text-[--text]">State alignment</h3>
        </div>
        <div className="p-6 text-center">
          <span className="w-5 h-5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin inline-block" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const { stateCode, alignmentPct, matchedBills, totalBills, details } = data
  const visibleDetails = showAll ? details : details.slice(0, 6)

  // Color the score ring
  const ringColor =
    alignmentPct === null ? 'text-[--text-muted]'
    : alignmentPct >= 70 ? 'text-emerald-600'
    : alignmentPct >= 40 ? 'text-amber-600'
    : 'text-red-500'

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[--accent]" />
        <h3 className="font-display text-sm font-bold text-[--text] flex-1">
          Alignment with {stateCode}
        </h3>
        <Link href={`/states/${stateCode}`} className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
          State page →
        </Link>
      </div>

      {alignmentPct === null ? (
        /* No overlap yet */
        <div className="p-6 text-center">
          <Users className="w-8 h-8 text-[--text-muted] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold text-[--text] mb-1">Not enough data yet</p>
          <p className="text-xs text-[--text-muted]">
            We need citizens in {stateCode} to vote on bills this member also voted on.
          </p>
        </div>
      ) : (
        <>
          {/* Hero stat */}
          <div className="p-5 text-center bg-[--surface-secondary]/40 border-b border-[--border]">
            <div className={`font-display text-4xl font-extrabold ${ringColor}`}>
              {alignmentPct}%
            </div>
            <p className="text-xs text-[--text-muted] mt-1">
              Voted with {stateCode} majority on{' '}
              <span className="font-semibold text-[--text]">{matchedBills}</span>{' '}
              of <span className="font-semibold text-[--text]">{totalBills}</span> bills
            </p>
          </div>

          {/* Per-bill breakdown */}
          <div className="divide-y divide-[--border]">
            {visibleDetails.map(d => {
              const yesPct = d.stateBreakdown.total > 0
                ? Math.round((d.stateBreakdown.yes / d.stateBreakdown.total) * 100)
                : 0
              const Icon = d.aligned === true ? Check : d.aligned === false ? X : Minus
              const iconColor = d.aligned === true
                ? 'text-emerald-600 bg-emerald-50'
                : d.aligned === false
                ? 'text-red-600 bg-red-50'
                : 'text-[--text-muted] bg-[--surface-secondary]'

              return (
                <Link key={d.billId} href={`/bills/${d.billId}`}
                  className="group flex items-center gap-3 px-5 py-3 hover:bg-[--surface-secondary] transition-colors"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="badge bg-[--dark] text-white text-[10px]">{d.billType} {d.billNumber}</span>
                      <span className="text-[10px] text-[--text-muted]">
                        Rep: <span className="font-semibold uppercase">{d.memberPosition === 'yea' ? 'Yea' : 'Nay'}</span>
                      </span>
                      <span className="text-[10px] text-[--text-muted]">·</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{yesPct}% yes</span>
                    </div>
                    <p className="text-xs font-medium text-[--text] group-hover:text-[--accent] transition-colors line-clamp-1">
                      {d.billTitle}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>

          {details.length > 6 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="w-full px-5 py-3 text-xs font-semibold text-[--accent] hover:text-[--accent-hover] hover:bg-[--surface-secondary] transition-colors border-t border-[--border]"
            >
              {showAll ? 'Show less' : `Show all ${details.length} bills`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

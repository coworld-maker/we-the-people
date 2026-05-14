'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp, Users } from 'lucide-react'
import Link from 'next/link'

const STORAGE_KEY = 'my-reps-state'

interface Comparison {
  billId: string
  billType: string
  billNumber: string
  billTitle: string
  userPosition: string
  repPosition: string
  match: boolean
  votedAt: string | null
}

interface Rep {
  bioguideId: string
  name: string
  party: string
  chamber: string
  district: string | null
  alignment: number | null
  overlappingVotes: number
  comparisons: Comparison[]
}

function AlignmentRing({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'
  return (
    <div className={`text-center ${color}`}>
      <div className="text-3xl font-display font-extrabold leading-none">{pct}%</div>
      <div className="text-[10px] font-medium text-[--text-muted] mt-0.5">alignment</div>
    </div>
  )
}

function PositionBadge({ position, userSide }: { position: string; userSide?: boolean }) {
  const p = position.toLowerCase()
  const isYes = p === 'yes' || p === 'yea' || p === 'aye'
  const isNo = p === 'no' || p === 'nay'
  const label = userSide
    ? (isYes ? 'Yes' : isNo ? 'No' : 'Abstain')
    : (isYes ? 'Yea' : isNo ? 'Nay' : position === 'not_voting' ? 'Not Voting' : 'Present')
  const cls = isYes
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isNo
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-50 text-gray-500 border-gray-200'
  return <span className={`badge border text-[10px] ${cls}`}>{label}</span>
}

function RepCard({ rep }: { rep: Rep }) {
  const [open, setOpen] = useState(false)
  const partyColor = rep.party === 'R' ? 'bg-red-500' : rep.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'
  const partyBadge = rep.party === 'R'
    ? 'bg-red-50 text-red-700 border-red-200'
    : rep.party === 'D'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-gray-50 text-gray-600 border-gray-200'
  const initials = rep.name.split(',')[0]?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'
  const office = rep.chamber === 'Senate'
    ? 'U.S. Senator'
    : `U.S. Representative${rep.district ? ` — District ${rep.district}` : ''}`

  return (
    <div className="card overflow-hidden">
      <div className={`h-1 ${partyColor}`} />
      <div className="p-5">
        {/* Rep header */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${partyColor}`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-bold text-[--text] leading-tight">{rep.name}</h3>
            <p className="text-xs text-[--text-secondary] mt-0.5">{office}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`badge border text-[10px] ${partyBadge}`}>
                {rep.party === 'R' ? 'Republican' : rep.party === 'D' ? 'Democrat' : 'Independent'}
              </span>
              <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-[10px]">
                {rep.chamber}
              </span>
            </div>
          </div>

          {/* Alignment score */}
          <div className="shrink-0">
            {rep.alignment !== null ? (
              <AlignmentRing pct={rep.alignment} />
            ) : (
              <div className="text-center">
                <div className="text-sm font-display font-bold text-[--text-muted]">—</div>
                <div className="text-[10px] text-[--text-muted]">no overlap</div>
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t border-[--border] flex items-center justify-between">
          <div className="text-xs text-[--text-secondary]">
            {rep.overlappingVotes === 0 ? (
              <span className="text-[--text-muted] italic">No overlapping votes yet</span>
            ) : (
              <>
                <span className="font-semibold text-[--text]">{rep.overlappingVotes}</span> bill
                {rep.overlappingVotes !== 1 ? 's' : ''} in common
              </>
            )}
          </div>
          {rep.comparisons.length > 0 && (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1 text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors"
            >
              {open ? 'Hide' : 'Show'} votes
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Comparison table */}
        {open && rep.comparisons.length > 0 && (
          <div className="mt-3 space-y-2">
            {rep.comparisons.map(c => (
              <div key={c.billId}
                className="flex items-center gap-3 p-3 rounded-lg bg-[--surface-secondary] text-xs"
              >
                {/* Match icon */}
                <div className="shrink-0">
                  {c.match
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : c.repPosition === 'not_voting' || c.repPosition === 'present'
                    ? <MinusCircle className="w-4 h-4 text-gray-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                  }
                </div>

                {/* Bill info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/bills?search=${encodeURIComponent(`${c.billType} ${c.billNumber}`)}`}
                    className="font-medium text-[--text] hover:text-[--accent] transition-colors line-clamp-1"
                  >
                    {c.billType} {c.billNumber} — {c.billTitle}
                  </Link>
                </div>

                {/* Positions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <PositionBadge position={c.userPosition} userSide />
                  <span className="text-[--text-muted]">vs</span>
                  <PositionBadge position={c.repPosition} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CompareViewProps {
  /** State code pre-selected by the map (e.g. 'CA'). Fetches automatically when it changes. */
  selectedState?: string
}

export default function CompareView({ selectedState }: CompareViewProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ reps: Rep[]; userVoteCount: number } | null>(null)
  const [error, setError] = useState('')
  const [lastFetched, setLastFetched] = useState('')

  // Auto-fetch whenever selectedState changes (from map click or localStorage restore)
  useEffect(() => {
    const s = selectedState || localStorage.getItem(STORAGE_KEY) || ''
    if (s && s !== lastFetched) {
      fetchForState(s)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState])

  async function fetchForState(s: string) {
    if (!s) return
    setLastFetched(s)
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch(`/api/compare?state=${encodeURIComponent(s)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load comparison')
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      {data && data.userVoteCount === 0 && (
        <div className="card p-10 text-center">
          <Users className="w-8 h-8 text-[--text-muted] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold text-[--text] mb-1">No votes on record yet</p>
          <p className="text-xs text-[--text-muted] mb-4">
            Vote on bills to see how your positions compare to your representatives'.
          </p>
          <Link href="/bills" className="btn-primary text-xs px-4 py-2">Browse Bills</Link>
        </div>
      )}

      {data && data.userVoteCount > 0 && data.reps.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-[--text-muted]">
            No representatives found in our database for this state yet.
          </p>
        </div>
      )}

      {data && data.reps.length > 0 && (
        <>
          <p className="text-xs text-[--text-muted] mb-4">
            Based on your <span className="font-semibold text-[--text]">{data.userVoteCount}</span> votes
            — showing bills where your representatives also cast a recorded vote.
          </p>
          <div className="space-y-4">
            {data.reps.map(rep => <RepCard key={rep.bioguideId} rep={rep} />)}
          </div>
        </>
      )}
    </div>
  )
}

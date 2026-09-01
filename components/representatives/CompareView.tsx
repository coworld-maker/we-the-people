'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp, Users } from 'lucide-react'
import Link from 'next/link'
import RepAvatar from '@/components/ui/RepAvatar'

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

interface RecentVote {
  billId: string
  billType: string
  billNumber: string
  billTitle: string
  position: string
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
  recentVotes: RecentVote[]
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
  const office = rep.chamber === 'Senate'
    ? 'U.S. Senator'
    : `U.S. Representative${rep.district ? ` — District ${rep.district}` : ''}`

  return (
    <div className="card overflow-hidden">
      <div className={`h-1 ${partyColor}`} />
      <div className="p-5">
        {/* Rep header */}
        <div className="flex items-start gap-4">
          <Link href={`/scorecards/${rep.bioguideId}`} className="shrink-0">
            <RepAvatar bioguideId={rep.bioguideId} fullName={rep.name} party={rep.party} size="lg" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/scorecards/${rep.bioguideId}`} className="group/name">
              <h3 className="font-display text-base font-bold text-[--text] leading-tight group-hover/name:text-[--accent] transition-colors">
                {rep.name}
              </h3>
            </Link>
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
              <span className="text-[--text-muted]">Vote on a bill to compare</span>
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


        {/* Their actual record — shown whether or not the user has voted. This is
            the answer to "what has my rep voted for?", which needs no input from
            the reader at all. */}
        {rep.recentVotes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[--border]">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[--text-muted]">
                Recent votes
              </p>
              {/* The card shows 5; the scorecard holds the member's full record. */}
              <Link
                href={`/scorecards/${rep.bioguideId}`}
                className="text-[11px] font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors shrink-0"
              >
                Full record →
              </Link>
            </div>
            <div className="space-y-1.5">
              {rep.recentVotes.map(v => {
                const yes = v.position === 'Yea'
                const no  = v.position === 'Nay'
                return (
                  <Link
                    key={v.billId}
                    href={`/bills/${v.billId}`}
                    className="flex items-start gap-2.5 group/vote"
                  >
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      yes ? 'bg-emerald-50 text-emerald-700'
                      : no ? 'bg-red-50 text-red-700'
                      : 'bg-[--surface-tertiary] text-[--text-muted]'
                    }`}>
                      {yes ? 'YES' : no ? 'NO' : v.position.toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0 text-xs text-[--text-secondary] leading-snug line-clamp-2 group-hover/vote:text-[--accent] transition-colors">
                      <span className="font-semibold text-[--text-muted]">
                        {v.billType} {v.billNumber}
                      </span>{' '}
                      {v.billTitle}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

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

      {/* Previously this replaced the entire list, so a reader with no votes saw
          nothing about their representatives at all. Their voting record doesn't
          depend on the reader having one — show it, and invite the comparison. */}
      {data && data.userVoteCount === 0 && data.reps.length > 0 && (
        <div className="card p-4 mb-4 flex items-center gap-3 flex-wrap">
          <Users className="w-4 h-4 text-[--text-muted] shrink-0" />
          <p className="text-xs text-[--text-secondary] flex-1 min-w-0">
            Below is how your representatives have voted. Cast your own vote on a bill
            to see where you agree.
          </p>
          <Link href="/bills" className="btn-primary text-xs px-3 py-1.5 shrink-0">Browse bills</Link>
        </div>
      )}

      {data && data.reps.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-[--text-muted]">
            No representatives found in our database for this state yet.
          </p>
        </div>
      )}

      {data && data.reps.length > 0 && (
        <>
          {data.userVoteCount > 0 && (
            <p className="text-xs text-[--text-muted] mb-4">
              Based on your <span className="font-semibold text-[--text]">{data.userVoteCount}</span> votes
              — showing bills where your representatives also cast a recorded vote.
            </p>
          )}
          <div className="space-y-4">
            {data.reps.map(rep => <RepCard key={rep.bioguideId} rep={rep} />)}
          </div>
        </>
      )}
    </div>
  )
}

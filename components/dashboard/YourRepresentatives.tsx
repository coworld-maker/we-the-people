'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MapPin, Edit3 } from 'lucide-react'
import Link from 'next/link'
import USStateMap from '@/components/ui/USStateMap'

interface Representative {
  name: string; office: string; party: string; state: string
  phone?: string; website?: string; chamber: string; bioguideId?: string
}

interface AlignmentData {
  alignmentPct: number; matchedVotes: number; totalOverlap: number
}

function AgreementBadge({ pct }: { pct: number }) {
  const bg = pct >= 70 ? 'bg-emerald-50 text-emerald-700'
    : pct >= 40 ? 'bg-amber-50 text-amber-700'
    : 'bg-red-50 text-red-700'
  return (
    <div className={`px-3 py-1.5 rounded-md ${bg}`}>
      <span className="text-lg font-bold">{pct}%</span>
      <p className="text-[10px] font-medium">Agreement</p>
    </div>
  )
}

function RepCard({ rep }: { rep: Representative }) {
  const [alignment, setAlignment] = useState<AlignmentData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (rep.bioguideId) calcAlignment()
  }, [rep.bioguideId])

  async function calcAlignment() {
    if (!rep.bioguideId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        bioguideId: rep.bioguideId,
        name: rep.name, party: rep.party, chamber: rep.chamber, state: rep.state,
      })
      const res = await fetch(`/api/alignment?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlignment(data)
      }
    } catch {} finally { setLoading(false) }
  }

  const initials = rep.name.split(',')[0]?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'
  const avatarBg = rep.party === 'R' ? 'bg-red-100 text-red-600' : rep.party === 'D' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'

  return (
    <div className="p-4 bg-[--surface-secondary] rounded-xl flex items-center gap-4">
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full ${avatarBg} flex items-center justify-center text-sm font-bold shrink-0`}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-[--text] leading-tight">{rep.name}</h3>
        <p className="text-xs text-[--text-muted]">
          {rep.office} ({rep.party === 'R' ? 'R' : rep.party === 'D' ? 'D' : 'I'})
        </p>
        {alignment ? (
          <div className="flex items-center gap-3 mt-1.5">
            <AgreementBadge pct={alignment.alignmentPct} />
            <span className="text-xs text-[--text-muted]">
              {alignment.matchedVotes}/{alignment.totalOverlap} votes match
            </span>
          </div>
        ) : loading ? (
          <p className="text-[10px] text-[--text-muted] mt-1 flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-[--text-muted]/30 border-t-[--text-muted] rounded-full animate-spin" />
            Calculating...
          </p>
        ) : (
          <p className="text-[10px] text-[--text-muted] mt-1 italic">Vote on bills to see alignment</p>
        )}
      </div>

    </div>
  )
}

const STORAGE_KEY = 'my-reps-state'

export default function YourRepresentatives({ userState }: { userState?: string | null }) {
  const [reps, setReps] = useState<Representative[]>([])
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState(userState || '')
  const [searched, setSearched] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  useEffect(() => {
    const initial = userState || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '')
    if (initial) {
      setState(initial)
      fetchReps(initial)
    } else {
      // No saved state — show the map by default so users can pick
      setMapOpen(true)
    }
  }, [userState])

  async function fetchReps(st: string) {
    setLoading(true); setSearched(true); setMapOpen(false)
    setState(st)
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, st)
    try {
      const res = await fetch(`/api/representatives?state=${encodeURIComponent(st)}`)
      if (res.ok) {
        const data = await res.json()
        setReps(data.representatives || [])
      }
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
        <h2 className="font-display text-base font-bold text-[--text] flex-1">Your Representatives</h2>
        {state && (
          <>
            <span className="badge bg-[--accent-light] text-[--accent] text-[10px]">{state}</span>
            <button
              onClick={() => setMapOpen(o => !o)}
              className="flex items-center gap-1 text-xs font-semibold text-[--text-muted] hover:text-[--accent] transition-colors"
              title="Change state"
            >
              <Edit3 className="w-3 h-3" /> {mapOpen ? 'Hide map' : 'Change'}
            </button>
          </>
        )}
      </div>

      {/* State picker map (collapsible) */}
      {mapOpen && (
        <div className="px-5 py-4 border-b border-[--border] bg-[--surface-secondary]/40">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[--accent]" />
            <p className="text-xs font-semibold text-[--text]">Tap your state on the map</p>
          </div>
          <USStateMap selected={state} onSelect={fetchReps} />
        </div>
      )}

      <div className="p-5">
        {loading && (
          <div className="text-center py-6">
            <span className="w-5 h-5 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin inline-block" />
            <p className="text-xs text-[--text-muted] mt-2">Finding your representatives...</p>
          </div>
        )}

        {!loading && reps.length > 0 && (
          <div className="space-y-3">
            {reps.map((rep, i) => <RepCard key={i} rep={rep} />)}
          </div>
        )}

        {!loading && searched && reps.length === 0 && (
          <p className="text-sm text-[--text-muted] text-center py-4">No representatives found.</p>
        )}

        {!loading && !searched && !mapOpen && (
          <p className="text-sm text-[--text-muted] text-center py-4">Tap a state on the map above to load your representatives.</p>
        )}

        {reps.length > 0 && (
          <Link href="/scorecards" className="block text-center text-xs font-semibold text-[--accent] hover:text-[--accent-hover] mt-4 transition-colors">
            View full scorecards →
          </Link>
        )}
      </div>
    </div>
  )
}

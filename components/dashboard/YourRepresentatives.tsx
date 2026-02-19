'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

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

      {/* Contact */}
      {rep.website && (
        <a href={rep.website} target="_blank" rel="noopener noreferrer"
          className="shrink-0 bg-[--accent] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[--accent-hover] transition-colors"
        >
          Contact
        </a>
      )}
    </div>
  )
}

export default function YourRepresentatives({ userState }: { userState?: string | null }) {
  const [reps, setReps] = useState<Representative[]>([])
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState(userState || '')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (userState) {
      setState(userState)
      fetchReps(userState)
    }
  }, [userState])

  async function fetchReps(st: string) {
    setLoading(true); setSearched(true)
    try {
      const res = await fetch(`/api/representatives?state=${encodeURIComponent(st)}`)
      if (res.ok) {
        const data = await res.json()
        setReps(data.representatives || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
  ]

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border]">
        <h2 className="font-display text-base font-bold text-[--text]">Your Representatives</h2>
      </div>
      <div className="p-5">
        {/* State selector (if no state set) */}
        {!searched && !userState && (
          <div className="flex gap-2 mb-4">
            <select value={state} onChange={e => setState(e.target.value)}
              className="flex-1 px-3 py-2 border border-[--border] rounded-lg text-sm text-[--text] bg-white focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
            >
              <option value="">Select your state...</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => state && fetchReps(state)} disabled={!state || loading}
              className="btn-primary px-4 text-sm disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Find'}
            </button>
          </div>
        )}

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

        {reps.length > 0 && (
          <Link href="/scorecards" className="block text-center text-xs font-semibold text-[--accent] hover:text-[--accent-hover] mt-4 transition-colors">
            View full scorecards →
          </Link>
        )}
      </div>
    </div>
  )
}

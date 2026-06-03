'use client'

import { useState, useEffect } from 'react'
import { MapPin, Edit3, Search, X } from 'lucide-react'
import Link from 'next/link'
import USStateMap from '@/components/ui/USStateMap'
import CollapsibleCard from '@/components/ui/CollapsibleCard'

interface Representative {
  name: string; office: string; party: string; state: string; district?: string | null
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
const DISTRICT_KEY = 'my-reps-district'

export default function YourRepresentatives({ userState }: { userState?: string | null }) {
  const [reps, setReps] = useState<Representative[]>([])
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState(userState || '')
  const [district, setDistrict] = useState<string | null>(null)
  const [totalHouse, setTotalHouse] = useState(0)
  const [searched, setSearched] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [zipInput, setZipInput] = useState('')
  const [zipLoading, setZipLoading] = useState(false)
  const [zipError, setZipError] = useState('')

  useEffect(() => {
    const initial = userState || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '')
    const savedDistrict = typeof localStorage !== 'undefined' ? localStorage.getItem(DISTRICT_KEY) : null
    if (savedDistrict) setDistrict(savedDistrict)
    if (initial) {
      setState(initial)
      fetchReps(initial, savedDistrict)
    } else {
      setMapOpen(true)
    }
  }, [userState])

  async function fetchReps(st: string, dist?: string | null) {
    setLoading(true); setSearched(true); setMapOpen(false)
    setState(st)
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, st)
    fetch('/api/user/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: st }),
    }).catch(() => {})
    try {
      const params = new URLSearchParams({ state: st })
      if (dist) params.set('district', dist)
      const res = await fetch(`/api/representatives?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReps(data.representatives || [])
        setTotalHouse(data.totalHouseMembers || 0)
      }
    } catch {} finally { setLoading(false) }
  }

  async function lookupDistrict() {
    const zip = zipInput.trim()
    if (!/^\d{5}$/.test(zip)) { setZipError('Enter a valid 5-digit zip'); return }
    setZipLoading(true); setZipError('')
    try {
      const res = await fetch(`/api/representatives/district?zip=${zip}`)
      const data = await res.json()
      if (data.district && data.state) {
        setDistrict(data.district)
        if (typeof localStorage !== 'undefined') localStorage.setItem(DISTRICT_KEY, data.district)
        // Re-fetch reps filtered to this district
        fetchReps(data.state, data.district)
        setState(data.state)
      } else {
        setZipError('Could not find your district — try a nearby zip')
      }
    } catch { setZipError('Lookup failed, please try again') }
    setZipLoading(false)
  }

  function clearDistrict() {
    setDistrict(null)
    if (typeof localStorage !== 'undefined') localStorage.removeItem(DISTRICT_KEY)
    fetchReps(state, null)
  }

  const headerRight = state ? (
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
  ) : undefined

  return (
    <CollapsibleCard
      storageKey="your-representatives"
      title="Your Representatives"
      headerRight={headerRight}
    >

      {/* State picker map (collapsible) */}
      {mapOpen && (
        <div className="px-5 py-4 border-b border-[--border] bg-[--surface-secondary]/40">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[--accent]" />
            <p className="text-xs font-semibold text-[--text]">Tap your state on the map</p>
          </div>
          <USStateMap selected={state} onSelect={st => fetchReps(st, district)} />
        </div>
      )}

      {/* Zip → district finder */}
      {state && (
        <div className="px-5 py-3 border-b border-[--border] bg-[--surface-secondary]/40">
          {district ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[--text-secondary]">
                Showing reps for <span className="font-semibold text-[--text]">{state} District {district}</span>
              </p>
              <button onClick={clearDistrict} className="text-[10px] text-[--text-muted] hover:text-[--accent] flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Show all {state} reps
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-[--text-muted] mb-2">
                {totalHouse > 1 ? `Showing all ${totalHouse} House members for ${state}. ` : ''}
                <span className="font-medium text-[--text]">Enter your zip to find your specific district rep.</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Your zip code"
                  value={zipInput}
                  onChange={e => { setZipInput(e.target.value.replace(/\D/g, '')); setZipError('') }}
                  onKeyDown={e => e.key === 'Enter' && lookupDistrict()}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[--border] bg-[--surface] text-[--text] placeholder-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--accent]"
                />
                <button
                  onClick={lookupDistrict}
                  disabled={zipLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[--accent] text-white text-xs font-semibold hover:bg-[--accent-dark] transition-colors disabled:opacity-60"
                >
                  {zipLoading ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
                  Find
                </button>
              </div>
              {zipError && <p className="text-[10px] text-red-500 mt-1">{zipError}</p>}
            </div>
          )}
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
          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold">
            <Link href={`/states/${state}`} className="text-[--accent] hover:text-[--accent-hover] transition-colors">
              {state} activity →
            </Link>
            <span className="text-[--text-muted]">·</span>
            <Link href="/scorecards" className="text-[--accent] hover:text-[--accent-hover] transition-colors">
              Full scorecards →
            </Link>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

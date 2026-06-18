'use client'

/**
 * Zip → district finder for a state page. Mirrors the dashboard's lookup but
 * scoped to one state: enter a zip, and it pinpoints which House member in this
 * state's delegation represents you (or tells you the zip is in another state).
 */

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Search, X, ArrowRight } from 'lucide-react'

interface HouseRep {
  bioguideId: string
  fullName: string
  district?: string | null
  party: string
}

export default function StateDistrictFinder({
  stateCode,
  houseReps,
}: {
  stateCode: string
  houseReps: HouseRep[]
}) {
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [match, setMatch] = useState<HouseRep | null>(null)
  const [otherState, setOtherState] = useState<string | null>(null)

  async function lookup() {
    const z = zip.trim()
    if (!/^\d{5}$/.test(z)) { setError('Enter a valid 5-digit zip'); return }
    setLoading(true); setError(''); setMatch(null); setOtherState(null)
    try {
      const res = await fetch(`/api/representatives/district?zip=${z}`)
      const d = await res.json()
      if (d.state && d.district != null) {
        if (String(d.state).toUpperCase() !== stateCode.toUpperCase()) {
          setOtherState(String(d.state).toUpperCase())
        } else {
          const m = houseReps.find(h => String(h.district) === String(d.district))
          if (m) setMatch(m)
          else setError(`That zip is ${stateCode} District ${d.district}, but we don't have that member yet.`)
        }
      } else {
        setError('Could not find your district — try a nearby zip.')
      }
    } catch {
      setError('Lookup failed, please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMatch(null); setOtherState(null); setError(''); setZip('')
  }

  return (
    <div className="mb-4 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <p className="text-xs font-semibold text-blue-900">Find your representative</p>
      </div>

      {match ? (
        <div className="flex items-center justify-between gap-2">
          <Link href={`/scorecards/${match.bioguideId}`}
            className="flex-1 text-xs text-blue-800 hover:underline">
            ✓ You're in <span className="font-bold">{stateCode} District {match.district}</span> — {match.fullName} →
          </Link>
          <button onClick={reset} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 shrink-0">
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      ) : otherState ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-blue-800">That zip is in <span className="font-bold">{otherState}</span>, not {stateCode}.</p>
          <Link href={`/states/${otherState}`} className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-0.5 shrink-0">
            View {otherState} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-blue-700 mb-2">Enter your zip to see your specific House member in {stateCode}.</p>
          <div className="flex gap-2">
            <input
              type="text" inputMode="numeric" maxLength={5}
              placeholder="5-digit zip"
              value={zip}
              onChange={e => { setZip(e.target.value.replace(/\D/g, '')); setError('') }}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-blue-200 bg-white text-[--text] placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={lookup} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
              {loading
                ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : <Search className="w-3 h-3" />}
              Find
            </button>
          </div>
          {error && <p className="text-[10px] text-red-600 mt-1.5 font-medium">{error}</p>}
        </>
      )}
    </div>
  )
}

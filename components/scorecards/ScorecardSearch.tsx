'use client'

import { useState } from 'react'
import { Search, ExternalLink, TrendingUp, User, ChevronDown, ChevronUp, Check, X, Minus } from 'lucide-react'

interface Representative {
  name: string; office: string; party: string; state: string
  phone?: string; website?: string; chamber: 'Senate' | 'House'
  bioguideId?: string; depiction?: string
}

interface AlignmentDetail {
  billType: string; billNumber: string; billTitle: string
  userPosition: string; memberPosition: string; aligned: boolean
}

interface AlignmentData {
  alignmentPct: number; matchedVotes: number; totalOverlap: number
  details: AlignmentDetail[]
}

function AlignmentBadge({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : pct >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200'
  return <span className={`badge border font-bold ${color}`}>{pct}% aligned</span>
}

function RepCard({ rep }: { rep: Representative }) {
  const [alignment, setAlignment] = useState<AlignmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  async function calcAlignment() {
    if (!rep.bioguideId) { setError('No bioguide ID available for this member.'); return }
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({
        bioguideId: rep.bioguideId,
        name: rep.name,
        party: rep.party,
        chamber: rep.chamber,
        state: rep.state,
      })
      const res = await fetch(`/api/alignment?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setAlignment(data)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="card overflow-hidden">
      <div className={`h-1.5 ${
        rep.party === 'R' ? 'bg-red-500' : rep.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'
      }`} />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
            rep.party === 'R' ? 'bg-red-500' : rep.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'
          }`}>
            {rep.name.split(',')[0]?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-bold text-[--text]">{rep.name}</h3>
            <p className="text-xs text-[--text-secondary]">{rep.office}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge border text-[10px] ${
                rep.party === 'R' ? 'bg-red-50 text-red-700 border-red-200'
                : rep.party === 'D' ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {rep.party === 'R' ? 'Republican' : rep.party === 'D' ? 'Democrat' : 'Independent'}
              </span>
              <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-[10px]">
                {rep.chamber}
              </span>
            </div>
          </div>
        </div>

        {/* Alignment section */}
        <div className="p-3 bg-[--surface-secondary] rounded-lg mb-3">
          {alignment ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[--accent]" />
                  <span className="text-xs font-semibold text-[--text] uppercase tracking-wider">Your alignment</span>
                </div>
                <AlignmentBadge pct={alignment.alignmentPct} />
              </div>

              {/* Progress bar */}
              <div className="h-2.5 rounded-full bg-[--surface-tertiary] overflow-hidden mb-2">
                <div className="h-2.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${alignment.alignmentPct}%`,
                    backgroundColor: alignment.alignmentPct >= 70 ? '#22C55E' : alignment.alignmentPct >= 40 ? '#F5A623' : '#E5484D',
                  }}
                />
              </div>

              <p className="text-xs text-[--text-muted]">
                {alignment.totalOverlap > 0
                  ? `Matched on ${alignment.matchedVotes} of ${alignment.totalOverlap} overlapping vote${alignment.totalOverlap !== 1 ? 's' : ''}`
                  : 'No overlapping votes found yet. Vote on more bills to see alignment.'}
              </p>

              {/* Vote details */}
              {alignment.details.length > 0 && (
                <div className="mt-2">
                  <button onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 text-xs text-[--accent] font-medium hover:text-[--accent-hover] transition-colors"
                  >
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Vote-by-vote breakdown
                  </button>
                  {showDetails && (
                    <div className="mt-2 space-y-1.5">
                      {alignment.details.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 bg-white rounded-md border border-[--border]">
                          {d.aligned
                            ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          }
                          <span className="text-[--text] font-medium truncate flex-1">{d.billType} {d.billNumber}</span>
                          <span className="text-[--text-muted] shrink-0">
                            You: {d.userPosition} · Rep: {d.memberPosition}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[--text-muted]" />
                <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">Alignment Score</span>
              </div>
              <button onClick={calcAlignment} disabled={loading}
                className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-[--accent]/30 border-t-[--accent] rounded-full animate-spin" />
                    Calculating alignment...
                  </span>
                ) : 'Calculate alignment score →'}
              </button>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {rep.website && (
            <a href={rep.website} target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-xs px-3 py-1.5 flex-1 justify-center"
            >
              Website <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ScorecardSearch() {
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Representative[] | null>(null)
  const [error, setError] = useState('')

  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
  ]

  async function handleSearch() {
    if (!state) return
    setLoading(true); setError(''); setResults(null)
    try {
      const res = await fetch(`/api/representatives?state=${encodeURIComponent(state)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResults(data.representatives)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <select value={state} onChange={e => setState(e.target.value)}
          className="flex-1 max-w-[200px] px-3 py-2.5 border border-[--border] rounded-lg text-sm text-[--text] bg-white focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
        >
          <option value="">Select state...</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleSearch} disabled={loading || !state} className="btn-primary px-5 disabled:opacity-50">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching
            </span>
          ) : (
            <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Search</span>
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

      {results && results.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {results.map((rep, i) => <RepCard key={i} rep={rep} />)}
        </div>
      )}

      {results && results.length === 0 && (
        <div className="card p-8 text-center">
          <User className="w-8 h-8 text-[--text-muted] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[--text-muted]">No representatives found for this state.</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Search, ExternalLink, TrendingUp, User } from 'lucide-react'

interface Representative {
  name: string; office: string; party: string; state: string
  phone?: string; website?: string; chamber: 'Senate' | 'House'
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
          {results.map((rep, i) => (
            <div key={i} className="card overflow-hidden">
              <div className={`h-1.5 ${
                rep.party === 'R' ? 'bg-red-500' : rep.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                    rep.party === 'R' ? 'bg-red-500' : rep.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {rep.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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

                <div className="p-3 bg-[--surface-secondary] rounded-lg mb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[--text-muted]" />
                    <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">Alignment Score</span>
                  </div>
                  <p className="text-xs text-[--text-muted] italic">
                    Vote on more bills to see how this official aligns with your views.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {rep.website && (
                    <a href={rep.website} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5 flex-1 justify-center"
                    >
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {rep.phone && (
                    <a href={`tel:${rep.phone}`} className="btn-primary text-xs px-3 py-1.5 flex-1 justify-center">
                      Call
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
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

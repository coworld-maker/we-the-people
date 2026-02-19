'use client'

import { useState } from 'react'
import { Search, MapPin, ExternalLink, User, Building, ChevronRight } from 'lucide-react'

interface Representative {
  name: string
  office: string
  party: string
  state: string
  phone?: string
  website?: string
  chamber: 'Senate' | 'House'
}

export default function RepFinder() {
  const [address, setAddress] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Representative[] | null>(null)
  const [error, setError] = useState('')

  async function handleSearch() {
    if (!state) { setError('Please select your state.'); return }
    setLoading(true); setError(''); setResults(null)

    try {
      const res = await fetch(`/api/representatives?state=${encodeURIComponent(state)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to find representatives')
      setResults(data.representatives)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
  ]

  return (
    <div>
      {/* Search form */}
      <div className="card p-5 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-[--text-muted] uppercase tracking-wider mb-1.5 block">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full px-3 py-2.5 border border-[--border] rounded-lg text-sm text-[--text] bg-white cursor-pointer focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
            >
              <option value="">Select your state...</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-[--text-muted] uppercase tracking-wider mb-1.5 block">Address (optional)</label>
            <input type="text" placeholder="123 Main St, City, State" value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-2.5 border border-[--border] rounded-lg text-sm text-[--text] placeholder-[--text-muted] focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading}
              className="btn-primary w-full sm:w-auto px-6 py-2.5 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching...
                </span>
              ) : (
                <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Find reps</span>
              )}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>
        )}
      </div>

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[--text-muted]">{results.length} representative{results.length !== 1 ? 's' : ''} found</p>

          {/* Group by chamber */}
          {['Senate', 'House'].map(chamber => {
            const members = results.filter(r => r.chamber === chamber)
            if (members.length === 0) return null
            return (
              <div key={chamber}>
                <h3 className="font-display text-xs font-bold text-[--text-muted] uppercase tracking-wider mb-2">
                  {chamber === 'Senate' ? 'U.S. Senate' : 'U.S. House of Representatives'}
                </h3>
                <div className="space-y-2">
                  {members.map((rep, i) => (
                    <div key={i} className="card p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                        rep.party === 'R' ? 'bg-red-500' : rep.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {rep.party || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-[--text]">{rep.name}</h4>
                        <p className="text-xs text-[--text-muted]">
                          {rep.office} · {rep.state}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {rep.phone && (
                          <a href={`tel:${rep.phone}`}
                            className="badge bg-[--surface-secondary] text-[--text-secondary] border border-[--border] hover:border-[--accent] hover:text-[--accent] transition-colors"
                          >
                            Call
                          </a>
                        )}
                        {rep.website && (
                          <a href={rep.website} target="_blank" rel="noopener noreferrer"
                            className="badge bg-[--accent-light] text-[--accent] hover:bg-[--accent] hover:text-white transition-colors"
                          >
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {results && results.length === 0 && (
        <div className="card p-8 text-center">
          <MapPin className="w-8 h-8 text-[--text-muted] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[--text-muted]">No representatives found. Try a different state or check your address.</p>
        </div>
      )}

      {/* External lookup links */}
      <div className="mt-6 p-4 bg-[--surface-secondary] rounded-lg">
        <p className="text-xs text-[--text-muted] mb-2">You can also look up representatives directly:</p>
        <div className="flex flex-wrap gap-2">
          <a href="https://www.congress.gov/members/find-your-member" target="_blank" rel="noopener noreferrer"
            className="badge bg-white text-[--text-secondary] border border-[--border] hover:border-[--accent] hover:text-[--accent] transition-colors"
          >
            Congress.gov <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://www.senate.gov/senators/senators-contact.htm" target="_blank" rel="noopener noreferrer"
            className="badge bg-white text-[--text-secondary] border border-[--border] hover:border-[--accent] hover:text-[--accent] transition-colors"
          >
            Senate.gov <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://www.house.gov/representatives/find-your-representative" target="_blank" rel="noopener noreferrer"
            className="badge bg-white text-[--text-secondary] border border-[--border] hover:border-[--accent] hover:text-[--accent] transition-colors"
          >
            House.gov <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

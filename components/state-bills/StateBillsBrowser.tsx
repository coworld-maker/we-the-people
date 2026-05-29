'use client'

import { useState, useCallback } from 'react'
import {
  Search, ExternalLink, Clock, Tag, ChevronRight,
  Landmark, AlertCircle, Loader2, Globe,
} from 'lucide-react'
import Link from 'next/link'

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DC:'Washington D.C.',DE:'Delaware',
  FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',
  IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',
  ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',
  RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',
  TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

const ALL_STATES = Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1]))

interface StateLegBill {
  id: string
  identifier: string
  title: string
  classification: string[]
  subject: string[]
  session: string
  firstActionDate: string | null
  latestActionDate: string | null
  latestActionDescription: string | null
  openstatesUrl: string
}

function timeAgo(d: string | null): string {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(d).toLocaleDateString()
}

function classLabel(cls: string): string {
  if (cls === 'bill') return 'Bill'
  if (cls === 'resolution') return 'Resolution'
  if (cls === 'joint resolution') return 'Joint Res.'
  if (cls === 'concurrent resolution') return 'Concurrent Res.'
  return cls
}

export default function StateBillsBrowser() {
  const [selectedState, setSelectedState] = useState<string>('')
  const [bills, setBills] = useState<StateLegBill[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filter, setFilter] = useState('')

  const loadBills = useCallback(async (code: string) => {
    if (!code) return
    setLoading(true)
    setSearched(true)
    setBills([])
    try {
      const res = await fetch(`/api/state-bills?state=${code}&limit=16`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setConfigured(data.configured ?? false)
      setBills(data.bills ?? [])
    } catch {
      setConfigured(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleStateChange = (code: string) => {
    setSelectedState(code)
    setFilter('')
    if (code) loadBills(code)
  }

  const filteredBills = bills.filter(b => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      b.title.toLowerCase().includes(q) ||
      b.identifier.toLowerCase().includes(q) ||
      b.subject.some(s => s.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* State picker */}
      <div className="card p-6">
        <label className="block text-sm font-semibold text-[--text] mb-3">
          Select a state to browse its legislature
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-muted] pointer-events-none" />
            <select
              value={selectedState}
              onChange={e => handleStateChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[--border] rounded-lg bg-[--surface] text-[--text] appearance-none focus:outline-none focus:ring-2 focus:ring-[--accent]/30 focus:border-[--accent] transition-colors cursor-pointer"
            >
              <option value="">Choose a state…</option>
              {ALL_STATES.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          {bills.length > 0 && (
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-muted] pointer-events-none" />
              <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter bills…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[--border] rounded-lg bg-[--surface] text-[--text] focus:outline-none focus:ring-2 focus:ring-[--accent]/30 focus:border-[--accent] transition-colors"
              />
            </div>
          )}
        </div>

        {selectedState && (
          <p className="text-xs text-[--text-muted] mt-3">
            Showing recent bills from the{' '}
            <span className="font-semibold text-[--text]">{STATE_NAMES[selectedState] ?? selectedState}</span> legislature,
            sorted by last activity. Data via{' '}
            <a href="https://openstates.org" target="_blank" rel="noopener noreferrer" className="text-[--accent] hover:underline">OpenStates</a>.
          </p>
        )}
      </div>

      {/* Not configured */}
      {searched && configured === false && !loading && (
        <div className="card p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[--text] mb-1">OpenStates not configured</p>
            <p className="text-sm text-[--text-secondary]">
              Add an <code className="px-1 py-0.5 bg-[--surface-secondary] rounded text-xs">OPENSTATES_API_KEY</code> environment variable
              to enable state legislature browsing. Get a free key at{' '}
              <a href="https://openstates.org/api/register/" target="_blank" rel="noopener noreferrer" className="text-[--accent] hover:underline">
                openstates.org/api/register
              </a>.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-10 text-center">
          <Loader2 className="w-6 h-6 text-[--accent] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-[--text-muted]">Loading {STATE_NAMES[selectedState] ?? selectedState} bills…</p>
        </div>
      )}

      {/* Bills list */}
      {!loading && filteredBills.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[--accent]" />
            <h2 className="font-display text-sm font-bold text-[--text] flex-1">
              {STATE_NAMES[selectedState] ?? selectedState} Legislature
            </h2>
            <span className="text-xs text-[--text-muted]">{filteredBills.length} bills</span>
          </div>
          <div className="divide-y divide-[--border]">
            {filteredBills.map(bill => (
              <a
                key={bill.id}
                href={bill.openstatesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 px-5 py-4 hover:bg-[--surface-secondary] transition-colors"
              >
                {/* Identifier pill */}
                <div className="shrink-0 mt-0.5">
                  <span className="badge bg-[--dark] text-white text-[10px] font-mono">{bill.identifier}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[--text] group-hover:text-[--accent] transition-colors leading-snug line-clamp-2 mb-1.5">
                    {bill.title}
                  </p>

                  {/* Subjects */}
                  {bill.subject.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {bill.subject.slice(0, 3).map(s => (
                        <span key={s} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-[--surface-secondary] text-[--text-muted] rounded border border-[--border]">
                          <Tag className="w-2.5 h-2.5" /> {s}
                        </span>
                      ))}
                      {bill.subject.length > 3 && (
                        <span className="text-[10px] text-[--text-muted]">+{bill.subject.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[10px] text-[--text-muted]">
                    {bill.classification.length > 0 && (
                      <span className="capitalize">{bill.classification.map(classLabel).join(', ')}</span>
                    )}
                    <span>Session: {bill.session}</span>
                    {bill.latestActionDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Updated {timeAgo(bill.latestActionDate)}
                      </span>
                    )}
                  </div>

                  {bill.latestActionDescription && (
                    <p className="text-[11px] text-[--text-secondary] mt-1 line-clamp-1">
                      {bill.latestActionDescription}
                    </p>
                  )}
                </div>

                <ExternalLink className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0 mt-1" />
              </a>
            ))}
          </div>

          {/* Footer link */}
          <div className="px-5 py-3 border-t border-[--border] flex items-center justify-between">
            <a
              href={`https://openstates.org/${selectedState.toLowerCase()}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[--accent] font-semibold hover:underline flex items-center gap-1"
            >
              View all {STATE_NAMES[selectedState] ?? selectedState} bills on OpenStates
              <ExternalLink className="w-3 h-3" />
            </a>
            {selectedState && (
              <Link
                href={`/states/${selectedState}`}
                className="text-xs text-[--text-muted] hover:text-[--accent] transition-colors flex items-center gap-1"
              >
                {STATE_NAMES[selectedState]} overview <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Empty state after search */}
      {!loading && searched && configured !== false && filteredBills.length === 0 && bills.length > 0 && (
        <div className="card p-8 text-center">
          <Search className="w-6 h-6 text-[--text-muted] mx-auto mb-2 opacity-40" />
          <p className="text-sm text-[--text-muted]">No bills match your filter.</p>
        </div>
      )}

      {!loading && searched && configured !== false && bills.length === 0 && selectedState && (
        <div className="card p-8 text-center">
          <Landmark className="w-6 h-6 text-[--text-muted] mx-auto mb-2 opacity-40" />
          <p className="text-sm text-[--text-muted]">No recent bills found for {STATE_NAMES[selectedState] ?? selectedState}.</p>
        </div>
      )}

      {/* Prompt to pick state */}
      {!searched && (
        <div className="card p-10 text-center border-dashed">
          <Globe className="w-8 h-8 text-[--text-muted] mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold text-[--text] mb-1">Pick a state above to get started</p>
          <p className="text-xs text-[--text-muted]">
            Most everyday laws — housing, schools, healthcare — are made at the state level.
          </p>
        </div>
      )}
    </div>
  )
}

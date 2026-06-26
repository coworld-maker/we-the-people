'use client'

import { Calendar, Clock, ExternalLink } from 'lucide-react'
import { futureStaticElections } from '@/lib/data/upcoming-elections'

interface CivicElection {
  id: string
  name: string
  electionDay: string
  ocdDivisionId: string
}

interface Props {
  upcoming: CivicElection[]
  recent: CivicElection[]
  configured: boolean
}

function formatElectionDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00') // noon to avoid TZ shift
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// Handles both state:xx and district:xx (e.g. DC uses "district:dc")
function extractStateFromOcd(ocd: string): string | null {
  const match = ocd.match(/\/(?:state|district):([a-z]{2})/)
  if (!match) return null
  // Map district:dc → "DC"
  return match[1].toUpperCase()
}

function isRunoff(name: string): boolean {
  return /runoff/i.test(name)
}

export default function ElectionsClient({ upcoming, recent }: Props) {
  // Prefer live data if available; otherwise fall back to the static, always-
  // accurate nationwide calendar (the live Google Civic API was retired).
  const upcomingToShow = upcoming.length > 0 ? upcoming : futureStaticElections()

  if (upcomingToShow.length === 0 && recent.length === 0) return null

  return (
    <div className="mb-8 space-y-6">
      {/* Upcoming */}
      {upcomingToShow.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[--accent]" />
            <h2 className="font-display text-lg font-bold text-[--text]">Upcoming Elections</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingToShow.map(election => {
              const days = daysUntil(election.electionDay)
              const stateCode = extractStateFromOcd(election.ocdDivisionId)
              const today = days <= 0
              const runoff = isRunoff(election.name)
              return (
                <div
                  key={election.id}
                  className={`card p-5 group transition-all ${
                    today ? 'border-red-300 bg-red-50/40 shadow-sm' : ''
                  }`}
                >
                  {/* Today banner */}
                  {today && (
                    <div className="flex items-center gap-1.5 mb-2.5 text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Happening Today</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className={`text-sm font-semibold leading-snug flex-1 ${today ? 'text-red-700' : 'text-[--text]'}`}>
                      {election.name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {runoff && (
                        <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">Runoff</span>
                      )}
                      {stateCode && (
                        <span className={`badge shrink-0 ${today ? 'bg-red-100 text-red-700' : 'bg-[--accent-light] text-[--accent]'}`}>
                          {stateCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[--text-muted]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatElectionDate(election.electionDay)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      today        ? 'bg-red-100 text-red-700' :
                      days <= 7   ? 'bg-red-50 text-red-600' :
                      days <= 30  ? 'bg-amber-50 text-amber-700' :
                                    'bg-[--surface-secondary] text-[--text-muted]'
                    }`}>
                      {today ? 'Today — Go Vote!' : `${days} day${days === 1 ? '' : 's'} away`}
                    </span>
                    <a
                      href={stateCode ? `https://vote.gov/state/${stateCode.toLowerCase()}` : 'https://vote.gov'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[--accent] font-medium hover:underline"
                    >
                      Voter info <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[--text-muted]" />
            <h2 className="font-display text-base font-bold text-[--text]">Recent Elections</h2>
          </div>
          <div className="card overflow-hidden">
            <div className="divide-y divide-[--border]">
              {recent.map(election => {
                const stateCode = extractStateFromOcd(election.ocdDivisionId)
                return (
                  <div key={election.id} className="flex items-center gap-4 px-5 py-3.5">
                    {stateCode && (
                      <span className="badge bg-[--surface-secondary] text-[--text-muted] shrink-0">{stateCode}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[--text]">{election.name}</p>
                      <p className="text-xs text-[--text-muted] mt-0.5">{formatElectionDate(election.electionDay)}</p>
                    </div>
                    {stateCode && (
                      <a
                        href={`https://ballotpedia.org/${election.name.replace(/ /g, '_')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[--text-muted] hover:text-[--accent] transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

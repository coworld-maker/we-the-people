'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, BarChart3, Users, Shield, FileText,
  Check, X, Minus, ChevronDown, ChevronUp,
  Vote, AlertCircle, Loader2, Building2,
  CalendarDays, Activity,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface RepProfile {
  bioguideId: string
  firstName: string
  lastName: string
  fullName: string
  party: string
  state: string
  district: string | null
  chamber: string
  termStart: string
  committees: string[]
}

interface ScorecardData {
  bioguideId: string
  repProfile: RepProfile | null
  votingRecords: any[]
  keyPositions: any[]
  sponsoredBills: any[]
  alignment: { score: number | null; matched: number; total: number; details: any[] }
  communityComparison: any[]
  stats: {
    totalVotesTracked: number
    yeaCount: number
    nayCount: number
    notVotingCount: number
    participationRate: number | null
    partyLinePct: number | null
    partyLineTotal: number
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AlignmentMeter({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-[--surface-secondary] rounded-full flex items-center justify-center mx-auto mb-3">
        <Vote className="w-5 h-5 text-[--text-muted]" />
      </div>
      <p className="text-sm text-[--text-muted]">Vote on bills to see your alignment score</p>
      <Link href="/bills" className="text-xs text-[--accent] font-medium mt-1 block hover:underline">
        Browse bills →
      </Link>
    </div>
  )

  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F5A623' : '#E5484D'
  const label = score >= 70 ? 'Strong alignment' : score >= 40 ? 'Moderate alignment' : 'Low alignment'

  return (
    <div className="text-center py-4">
      <div className="relative inline-flex items-center justify-center mb-4">
        <svg width="120" height="120" className="-rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-tertiary)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - score / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-extrabold text-[--text]">{score}%</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-[--text]">{label}</p>
    </div>
  )
}

function PositionBar({ label, yeaPct, nayPct, totalVotes }: any) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[--text] truncate flex-1 mr-2">{label}</span>
        <span className="text-[10px] text-[--text-muted] shrink-0">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${yeaPct}%` }} />
        <div className="bg-red-500 rounded-full transition-all duration-700" style={{ width: `${nayPct}%` }} />
        <div className="bg-[--surface-tertiary] rounded-full flex-1" />
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] text-emerald-600 font-medium">{yeaPct}% yea</span>
        <span className="text-[10px] text-red-600 font-medium">{nayPct}% nay</span>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc, action }: any) {
  return (
    <div className="py-10 text-center">
      <div className="w-12 h-12 bg-[--surface-secondary] rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-[--text-muted]" />
      </div>
      <p className="text-sm font-medium text-[--text] mb-1">{title}</p>
      <p className="text-xs text-[--text-muted] max-w-xs mx-auto">{desc}</p>
      {action}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  enacted:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  passed_both:    'bg-green-50 text-green-700 border-green-200',
  passed_chamber: 'bg-amber-50 text-amber-700 border-amber-200',
  reported:       'bg-blue-50 text-blue-700 border-blue-200',
  in_committee:   'bg-orange-50 text-orange-700 border-orange-200',
  introduced:     'bg-[--surface-secondary] text-[--text-muted] border-[--border]',
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScorecardDetailPage() {
  const params = useParams()
  const bioguideId = params.bioguideId as string

  const [data, setData] = useState<ScorecardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'voting' | 'positions' | 'alignment' | 'community' | 'sponsored'>('voting')
  const [showAllVotes, setShowAllVotes] = useState(false)
  const [showAlignmentDetails, setShowAlignmentDetails] = useState(false)
  const [showCommittees, setShowCommittees] = useState(false)

  // Fallback rep info from sessionStorage (from search page navigation)
  const [sessionRep, setSessionRep] = useState<any>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(`rep_${bioguideId}`)
    if (stored) setSessionRep(JSON.parse(stored))

    fetch(`/api/scorecard/${bioguideId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [bioguideId])

  // Resolve rep info: API > sessionStorage
  const repProfile = data?.repProfile
  const repName = repProfile?.fullName ?? sessionRep?.name ?? 'Representative'
  const repOffice = repProfile
    ? (repProfile.chamber === 'Senate'
        ? `U.S. Senator — ${repProfile.state}`
        : `U.S. Representative — ${repProfile.state}${repProfile.district ? ` District ${repProfile.district}` : ''}`)
    : sessionRep?.office ?? ''
  const repParty = repProfile?.party ?? sessionRep?.party ?? 'I'
  const committees = repProfile?.committees ?? []

  const partyColor = repParty === 'R' ? 'bg-red-500' : repParty === 'D' ? 'bg-blue-500' : 'bg-gray-400'
  const partyBadge = repParty === 'R'
    ? 'bg-red-50 text-red-700 border-red-200'
    : repParty === 'D'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-gray-50 text-gray-600 border-gray-200'
  const partyLabel = repParty === 'R' ? 'Republican' : repParty === 'D' ? 'Democrat' : 'Independent'

  const initials = repName
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const tabs = [
    { id: 'voting',     label: 'Voting',    icon: BarChart3,  count: data?.stats.totalVotesTracked },
    { id: 'positions',  label: 'Positions', icon: Shield,     count: data?.keyPositions.length },
    { id: 'alignment',  label: 'Alignment', icon: TrendingUp, count: data?.alignment.score != null ? `${data.alignment.score}%` : null },
    { id: 'community',  label: 'Community', icon: Users,      count: data?.communityComparison.length },
    { id: 'sponsored',  label: 'Sponsored', icon: FileText,   count: data?.sponsoredBills.length },
  ]

  const hasRepInfo = repProfile || sessionRep

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/scorecards"
        className="inline-flex items-center gap-1.5 text-sm text-[--text-secondary] hover:text-[--text] transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Scorecards
      </Link>

      {/* Rep header card */}
      {hasRepInfo && (
        <div className="card overflow-hidden mb-6">
          <div className={`h-1.5 ${partyColor}`} />
          <div className="p-5 sm:p-6">

            {/* Top row: avatar + name + actions */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex items-center gap-4 sm:contents">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0 ${partyColor}`}>
                  {initials || '?'}
                </div>
                <div className="flex-1 sm:hidden">
                  <h1 className="font-display text-lg font-extrabold text-[--text] leading-tight">{repName}</h1>
                  <p className="text-xs text-[--text-secondary] mt-0.5">{repOffice}</p>
                </div>
              </div>

              <div className="flex-1">
                <h1 className="hidden sm:block font-display text-2xl font-extrabold text-[--text]">{repName}</h1>
                <p className="hidden sm:block text-sm text-[--text-secondary] mt-0.5">{repOffice}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`badge border text-xs ${partyBadge}`}>{partyLabel}</span>
                  <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-xs">
                    {repProfile?.chamber ?? sessionRep?.chamber}
                  </span>
                  {data && (
                    <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-xs">
                      {data.stats.totalVotesTracked} votes tracked
                    </span>
                  )}
                  {repProfile?.termStart && (
                    <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-xs flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      Since {new Date(repProfile.termStart).getFullYear()}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Quick stats */}
            {data && data.stats.totalVotesTracked > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-[--border]">
                <div className="text-center p-2 rounded-lg bg-[--surface-secondary]">
                  <div className="text-lg font-display font-extrabold text-emerald-600">
                    {Math.round((data.stats.yeaCount / data.stats.totalVotesTracked) * 100)}%
                  </div>
                  <div className="text-[10px] text-[--text-muted] mt-0.5 uppercase tracking-wide">Yea</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[--surface-secondary]">
                  <div className="text-lg font-display font-extrabold text-red-600">
                    {Math.round((data.stats.nayCount / data.stats.totalVotesTracked) * 100)}%
                  </div>
                  <div className="text-[10px] text-[--text-muted] mt-0.5 uppercase tracking-wide">Nay</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[--surface-secondary]">
                  <div className="text-lg font-display font-extrabold text-[--accent]">
                    {data.stats.participationRate ?? '—'}%
                  </div>
                  <div className="text-[10px] text-[--text-muted] mt-0.5 uppercase tracking-wide">Participation</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[--surface-secondary]">
                  <div className={`text-lg font-display font-extrabold ${
                    data.stats.partyLinePct != null
                      ? data.stats.partyLinePct >= 90 ? 'text-purple-600'
                      : data.stats.partyLinePct >= 70 ? 'text-amber-600'
                      : 'text-emerald-600'
                      : 'text-[--text-muted]'
                  }`}>
                    {data.stats.partyLinePct != null ? `${data.stats.partyLinePct}%` : '—'}
                  </div>
                  <div className="text-[10px] text-[--text-muted] mt-0.5 uppercase tracking-wide">Party line</div>
                </div>
              </div>
            )}

            {/* Committees */}
            {committees.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[--border]">
                <button
                  onClick={() => setShowCommittees(o => !o)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[--text-secondary] hover:text-[--text] transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-[--text-muted]" />
                  {committees.length} Committee{committees.length !== 1 ? 's' : ''}
                  {showCommittees ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {showCommittees && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {committees.map((c, i) => (
                      <span key={i} className="badge bg-[--accent-light] text-[--accent] text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[--surface-secondary] rounded-xl mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-1 justify-center min-w-[52px] ${
              activeTab === tab.id
                ? 'bg-white text-[--text] shadow-sm'
                : 'text-[--text-secondary] hover:text-[--text]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && tab.count !== 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full hidden sm:inline-block ${
                activeTab === tab.id ? 'bg-[--accent] text-white' : 'bg-[--surface-tertiary] text-[--text-muted]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader2 className="w-6 h-6 text-[--accent] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-[--text-muted]">Loading scorecard data…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card p-6 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tab content */}
      {data && !loading && (
        <div className="card overflow-hidden">

          {/* ── Voting Record ─────────────────────────────────────────────── */}
          {activeTab === 'voting' && (
            <div>
              <div className="px-5 sm:px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Voting Record</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">
                  How this member voted on bills tracked in our database
                </p>
              </div>
              {data.votingRecords.length === 0 ? (
                <EmptyState icon={BarChart3} title="No voting records yet"
                  desc="Sync more 119th Congress bills to see this member's voting record." />
              ) : (
                <div className="divide-y divide-[--border]">
                  {(showAllVotes ? data.votingRecords : data.votingRecords.slice(0, 10)).map((v, i) => (
                    <Link key={i} href={`/bills/${v.bill?.id}`}
                      className="group flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-[--surface-secondary] transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        v.position === 'yea' ? 'bg-emerald-50'
                        : v.position === 'nay' ? 'bg-red-50' : 'bg-[--surface-secondary]'
                      }`}>
                        {v.position === 'yea' ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                        : v.position === 'nay' ? <X className="w-3.5 h-3.5 text-red-600" />
                        : <Minus className="w-3.5 h-3.5 text-[--text-muted]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[--text] font-medium group-hover:text-[--accent] transition-colors truncate">
                          {v.bill?.shortTitle || v.bill?.title}
                        </p>
                        <p className="text-xs text-[--text-muted]">
                          {v.bill?.billType} {v.bill?.billNumber}
                          {v.bill?.policyArea && ` · ${v.bill.policyArea}`}
                          {v.votedAt && ` · ${new Date(v.votedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                        </p>
                      </div>
                      <span className={`badge border text-[10px] shrink-0 ${
                        v.position === 'yea' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : v.position === 'nay' ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-[--surface-secondary] text-[--text-muted] border-[--border]'
                      }`}>
                        {v.position.replace('_', ' ')}
                      </span>
                    </Link>
                  ))}
                  {data.votingRecords.length > 10 && (
                    <button
                      onClick={() => setShowAllVotes(!showAllVotes)}
                      className="w-full px-6 py-3 text-xs text-[--accent] font-semibold hover:bg-[--surface-secondary] transition-colors flex items-center justify-center gap-1.5"
                    >
                      {showAllVotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showAllVotes ? 'Show less' : `Show all ${data.votingRecords.length} votes`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Key Positions ─────────────────────────────────────────────── */}
          {activeTab === 'positions' && (
            <div>
              <div className="px-5 sm:px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Key Positions</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">Voting patterns broken down by policy area</p>
              </div>
              {data.keyPositions.length === 0 ? (
                <EmptyState icon={Shield} title="No position data yet"
                  desc="Key positions are derived from voting records. More data is needed." />
              ) : (
                <div className="px-5 sm:px-6 py-4 divide-y divide-[--border]">
                  {data.keyPositions.map((pos, i) => (
                    <PositionBar key={i} label={pos.policyArea}
                      yeaPct={pos.yeaPct} nayPct={pos.nayPct} totalVotes={pos.totalVotes} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Alignment ─────────────────────────────────────────────────── */}
          {activeTab === 'alignment' && (
            <div>
              <div className="px-5 sm:px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Your Alignment</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">
                  How often this member votes the same way you do
                </p>
              </div>
              <div className="px-5 sm:px-6 py-4">
                <AlignmentMeter score={data.alignment.score} />
                {data.alignment.total > 0 && (
                  <p className="text-xs text-center text-[--text-muted] -mt-2 mb-4">
                    Based on {data.alignment.matched} matching vote{data.alignment.matched !== 1 ? 's' : ''} out of {data.alignment.total} overlapping
                  </p>
                )}
                {data.alignment.details.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowAlignmentDetails(!showAlignmentDetails)}
                      className="flex items-center gap-1.5 text-xs text-[--accent] font-semibold mx-auto mb-3 hover:text-[--accent-hover] transition-colors"
                    >
                      {showAlignmentDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      Vote-by-vote breakdown
                    </button>
                    {showAlignmentDetails && (
                      <div className="space-y-1.5">
                        {data.alignment.details.map((d: any, i: number) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border text-xs ${
                            d.aligned ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                          }`}>
                            {d.aligned
                              ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              : <X className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                            <span className="text-[--text] font-medium truncate flex-1">{d.billTitle}</span>
                            <span className="text-[--text-muted] shrink-0 hidden sm:inline">
                              You: {d.userPosition} · Rep: {d.memberPosition}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Community Comparison ──────────────────────────────────────── */}
          {activeTab === 'community' && (
            <div>
              <div className="px-5 sm:px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Community Comparison</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">
                  How this member voted vs. how Democracy Unlocked users voted
                </p>
              </div>
              {data.communityComparison.length === 0 ? (
                <EmptyState icon={Users} title="No community data yet"
                  desc="Community comparison requires overlapping bills with enough user votes."
                  action={
                    <Link href="/bills" className="text-xs text-[--accent] font-medium mt-2 block hover:underline">
                      Vote on bills →
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y divide-[--border]">
                  {data.communityComparison.map((c: any, i: number) => (
                    <div key={i} className="px-5 sm:px-6 py-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[--text] line-clamp-2">{c.billTitle}</p>
                          <p className="text-xs text-[--text-muted]">
                            {c.billType} {c.billNumber} · {c.totalCommunityVotes} community votes
                          </p>
                        </div>
                        <span className={`badge border text-[10px] shrink-0 ${
                          c.memberAlignedWithCommunity
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {c.memberAlignedWithCommunity ? '✓ Aligned' : '✗ Opposed'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[10px] text-[--text-muted] mb-1">
                            <span>Community ({c.communityYeaPct}% yea)</span>
                            <span>{c.totalCommunityVotes} votes</span>
                          </div>
                          <div className="h-2 bg-[--surface-secondary] rounded-full overflow-hidden">
                            <div className="h-2 bg-[--accent] rounded-full" style={{ width: `${c.communityYeaPct}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[--text-muted]">Member voted:</span>
                          <span className={`badge border text-[10px] ${
                            c.memberPosition === 'yea'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {c.memberPosition}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Sponsored Bills ───────────────────────────────────────────── */}
          {activeTab === 'sponsored' && (
            <div>
              <div className="px-5 sm:px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Sponsored Bills</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">
                  Legislation this member introduced or sponsored
                </p>
              </div>
              {data.sponsoredBills.length === 0 ? (
                <EmptyState icon={FileText} title="No sponsored bills found"
                  desc="Bills sponsored by this member will appear here once synced." />
              ) : (
                <div className="divide-y divide-[--border]">
                  {data.sponsoredBills.map((bill: any, i: number) => {
                    const stCls = STATUS_STYLES[bill.status] ?? STATUS_STYLES.introduced
                    return (
                      <Link key={i} href={`/bills/${bill.id}`}
                        className="group flex items-start gap-3 px-5 sm:px-6 py-4 hover:bg-[--surface-secondary] transition-colors"
                      >
                        <div className="w-7 h-7 bg-[--accent-light] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5 text-[--accent]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="badge bg-[--dark] text-white text-[10px]">
                              {bill.billType} {bill.billNumber}
                            </span>
                            <span className={`badge border text-[10px] ${stCls}`}>
                              {statusLabel(bill.status)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[--text] group-hover:text-[--accent] transition-colors leading-snug">
                            {bill.shortTitle || bill.title}
                          </p>
                          {bill.policyArea && (
                            <p className="text-xs text-[--text-muted] mt-0.5">{bill.policyArea}</p>
                          )}
                          <p className="text-xs text-[--text-muted] mt-0.5">
                            Introduced {new Date(bill.introducedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No rep info fallback */}
      {!hasRepInfo && !loading && (
        <div className="card p-6 text-center">
          <p className="text-sm text-[--text-muted]">
            Rep info not found.{' '}
            <Link href="/scorecards" className="text-[--accent] hover:underline">Search for officials</Link>
          </p>
        </div>
      )}
    </div>
  )
}

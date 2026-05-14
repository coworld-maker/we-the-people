'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, BarChart3, Users, Shield,
  Check, X, Minus, ChevronDown, ChevronUp, ExternalLink,
  Vote, AlertCircle, Loader2, Share2, CheckCheck,
} from 'lucide-react'

interface ScorecardData {
  bioguideId: string
  votingRecords: any[]
  keyPositions: any[]
  alignment: { score: number | null; matched: number; total: number; details: any[] }
  communityComparison: any[]
  stats: { totalVotesTracked: number; yeaCount: number; nayCount: number; notVotingCount: number }
}

interface Rep {
  name: string; office: string; party: string; state: string
  chamber: string; website?: string; phone?: string
}

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
      {/* Circular meter */}
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

export default function ScorecardDetailPage() {
  const params = useParams()
  const bioguideId = params.bioguideId as string
  const [rep, setRep] = useState<Rep | null>(null)
  const [data, setData] = useState<ScorecardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'voting' | 'positions' | 'alignment' | 'community'>('voting')
  const [showAllVotes, setShowAllVotes] = useState(false)
  const [showAlignmentDetails, setShowAlignmentDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: rep?.name ?? 'Scorecard', url })
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  useEffect(() => {
    // Get rep info from sessionStorage (passed from search page)
    const stored = sessionStorage.getItem(`rep_${bioguideId}`)
    if (stored) setRep(JSON.parse(stored))

    // Fetch scorecard data
    fetch(`/api/scorecard/${bioguideId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [bioguideId])

  const partyColor = rep?.party === 'R' ? 'bg-red-500'
    : rep?.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'

  const tabs = [
    { id: 'voting', label: 'Voting Record', icon: BarChart3, count: data?.stats.totalVotesTracked },
    { id: 'positions', label: 'Key Positions', icon: Shield, count: data?.keyPositions.length },
    { id: 'alignment', label: 'Your Alignment', icon: TrendingUp, count: data?.alignment?.score != null ? `${data.alignment.score}%` : null },
    { id: 'community', label: 'Community', icon: Users, count: data?.communityComparison.length },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/scorecards"
        className="inline-flex items-center gap-1.5 text-sm text-[--text-secondary] hover:text-[--text] transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Scorecards
      </Link>

      {/* Rep header */}
      {rep && (
        <div className="card overflow-hidden mb-6">
          <div className={`h-1 ${partyColor}`} />
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Avatar + name row on mobile */}
              <div className="flex items-center gap-4 sm:contents">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0 ${partyColor}`}>
                  {rep.name.split(',')[0]?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                </div>
                <div className="flex-1 sm:hidden">
                  <h1 className="font-display text-lg font-extrabold text-[--text] leading-tight">{rep.name}</h1>
                  <p className="text-xs text-[--text-secondary] mt-0.5">{rep.office}</p>
                </div>
              </div>
              <div className="flex-1">
                <h1 className="hidden sm:block font-display text-2xl font-extrabold text-[--text]">{rep.name}</h1>
                <p className="hidden sm:block text-sm text-[--text-secondary]">{rep.office}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`badge border text-xs ${
                    rep.party === 'R' ? 'bg-red-50 text-red-700 border-red-200'
                    : rep.party === 'D' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {rep.party === 'R' ? 'Republican' : rep.party === 'D' ? 'Democrat' : 'Independent'}
                  </span>
                  <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-xs">
                    {rep.chamber}
                  </span>
                  <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-xs">
                    {rep.state}
                  </span>
                  {data && (
                    <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-xs">
                      {data.stats.totalVotesTracked} votes tracked
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleShare}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  {copied ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
                {rep.website && (
                  <a href={rep.website} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline ml-1">Official Site</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick stats */}
            {data && data.stats.totalVotesTracked > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[--border]">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-display font-extrabold text-emerald-600">
                    {Math.round((data.stats.yeaCount / data.stats.totalVotesTracked) * 100)}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-[--text-muted] mt-0.5">Yea</div>
                </div>
                <div className="text-center border-x border-[--border]">
                  <div className="text-lg sm:text-xl font-display font-extrabold text-red-600">
                    {Math.round((data.stats.nayCount / data.stats.totalVotesTracked) * 100)}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-[--text-muted] mt-0.5">Nay</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-display font-extrabold text-[--text-muted]">
                    {Math.round((data.stats.notVotingCount / data.stats.totalVotesTracked) * 100)}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-[--text-muted] mt-0.5">Absent</div>
                </div>
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
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-1 justify-center min-w-[60px] ${
              activeTab === tab.id
                ? 'bg-white text-[--text] shadow-sm'
                : 'text-[--text-secondary] hover:text-[--text]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
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
          <p className="text-sm text-[--text-muted]">Loading scorecard data...</p>
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
          {/* Voting Record */}
          {activeTab === 'voting' && (
            <div>
              <div className="px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Voting Record</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">How this member voted on bills in our database</p>
              </div>
              {data.votingRecords.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No voting records yet"
                  desc="Sync more 119th Congress bills to see this member's voting record."
                />
              ) : (
                <div className="divide-y divide-[--border]">
                  {(showAllVotes ? data.votingRecords : data.votingRecords.slice(0, 10)).map((v, i) => (
                    <div key={i} className="px-6 py-3.5 flex items-center gap-3 hover:bg-[--surface-secondary] transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        v.position === 'yea' ? 'bg-emerald-50'
                        : v.position === 'nay' ? 'bg-red-50' : 'bg-[--surface-secondary]'
                      }`}>
                        {v.position === 'yea' ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                        : v.position === 'nay' ? <X className="w-3.5 h-3.5 text-red-600" />
                        : <Minus className="w-3.5 h-3.5 text-[--text-muted]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[--text] font-medium truncate">{v.bill?.title}</p>
                        <p className="text-xs text-[--text-muted]">
                          {v.bill?.billType} {v.bill?.billNumber}
                          {v.bill?.policyArea && ` · ${v.bill.policyArea}`}
                        </p>
                      </div>
                      <span className={`badge border text-[10px] shrink-0 ${
                        v.position === 'yea' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : v.position === 'nay' ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-[--surface-secondary] text-[--text-muted] border-[--border]'
                      }`}>
                        {v.position.replace('_', ' ')}
                      </span>
                    </div>
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

          {/* Key Positions */}
          {activeTab === 'positions' && (
            <div>
              <div className="px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Key Positions</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">Voting patterns by policy area</p>
              </div>
              {data.keyPositions.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No position data yet"
                  desc="Key positions are derived from voting records. More data is needed to show patterns."
                />
              ) : (
                <div className="px-6 py-4 divide-y divide-[--border]">
                  {data.keyPositions.map((pos, i) => (
                    <PositionBar
                      key={i}
                      label={pos.policyArea}
                      yeaPct={pos.yeaPct}
                      nayPct={pos.nayPct}
                      totalVotes={pos.totalVotes}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alignment */}
          {activeTab === 'alignment' && (
            <div>
              <div className="px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Your Alignment</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">How often this member votes the same way you do</p>
              </div>
              <div className="px-6 py-4">
                <AlignmentMeter score={data.alignment.score} />
                {data.alignment.total > 0 && (
                  <p className="text-xs text-center text-[--text-muted] -mt-2 mb-4">
                    Based on {data.alignment.matched} matching votes out of {data.alignment.total} overlapping
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
            </div>
          )}

          {/* Community Comparison */}
          {activeTab === 'community' && (
            <div>
              <div className="px-6 py-4 border-b border-[--border]">
                <h2 className="font-display text-base font-bold text-[--text]">Community Comparison</h2>
                <p className="text-xs text-[--text-muted] mt-0.5">How this member voted vs. how Democracy Unlocked users voted</p>
              </div>
              {data.communityComparison.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No community data yet"
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
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[--text] truncate">{c.billTitle}</p>
                          <p className="text-xs text-[--text-muted]">{c.billType} {c.billNumber} · {c.totalCommunityVotes} community votes</p>
                        </div>
                        <span className={`badge border text-[10px] shrink-0 ${
                          c.memberAlignedWithCommunity
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {c.memberAlignedWithCommunity ? 'Aligned' : 'Opposed'} community
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
                            c.memberPosition === 'yea' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
        </div>
      )}

      {/* No rep info fallback */}
      {!rep && !loading && (
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

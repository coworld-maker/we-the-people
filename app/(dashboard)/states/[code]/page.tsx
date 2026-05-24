import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Users, Vote as VoteIcon, MessageSquare,
  Building2, Calendar, Check, X, Minus,
} from 'lucide-react'
import { headers } from 'next/headers'
import StateLegBills from '@/components/states/StateLegBills'
import StateAIDigest from '@/components/states/StateAIDigest'
import PolicyAreaPieChart from '@/components/states/PolicyAreaPieChart'
import DelegationCard from '@/components/states/DelegationCard'

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

const STATUS_CLS: Record<string, string> = {
  enacted:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  passed_both:    'bg-green-50 text-green-700 border-green-200',
  passed_chamber: 'bg-amber-50 text-amber-700 border-amber-200',
  reported:       'bg-blue-50 text-blue-700 border-blue-200',
  in_committee:   'bg-orange-50 text-orange-700 border-orange-200',
  introduced:     'bg-[--surface-secondary] text-[--text-muted] border-[--border]',
}

function timeAgo(d: Date | string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(d).toLocaleDateString()
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const name = STATE_NAMES[code.toUpperCase()] ?? code.toUpperCase()
  return {
    title: `${name} | Democracy Unlocked`,
    description: `What citizens in ${name} are voting on and discussing.`,
  }
}

async function fetchStateData(code: string) {
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const cookie = hdrs.get('cookie') ?? ''
  const res = await fetch(`${proto}://${host}/api/states/${code}`, {
    headers: { cookie },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function StatePage({ params }: { params: Promise<{ code: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { code: raw } = await params
  const code = raw.toUpperCase()
  const stateName = STATE_NAMES[code]
  if (!stateName) notFound()

  const data = await fetchStateData(code)
  if (!data) notFound()

  const { stats, topBills, policyAreas, discussions, reps, repActivity } = data
  const senators = reps.filter((r: any) => r.chamber === 'Senate')
  const houseReps = reps.filter((r: any) => r.chamber !== 'Senate')

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/my-representatives" className="inline-flex items-center gap-1 text-sm text-[--text-muted] hover:text-[--accent] font-medium mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to map
      </Link>

      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-5 py-6 sm:px-8 sm:py-8 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge bg-white/10 text-white border border-white/10">{code}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2">
          {stateName}
        </h1>
        <p className="text-white/70 text-sm sm:text-base">
          What citizens in {stateName} are voting on and discussing
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: 'Citizens', value: stats.citizenCount, accent: 'text-[--accent]' },
          { icon: VoteIcon, label: 'Votes cast', value: stats.totalVotes, accent: 'text-emerald-600' },
          { icon: MessageSquare, label: 'Discussions', value: stats.totalDiscussions, accent: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon className="w-3.5 h-3.5 text-[--text-muted]" />
              <span className="text-[10px] sm:text-xs font-medium text-[--text-muted] uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`font-display text-xl sm:text-2xl font-extrabold ${s.accent}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* AI-generated digest + policy-area pie chart — shown only when there's
          enough activity to summarize */}
      {stats.totalVotes > 0 && (
        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3">
            <StateAIDigest stateCode={code} stateName={stateName} />
          </div>
          {policyAreas && policyAreas.length > 0 && (
            <div className="lg:col-span-2 card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[--border]">
                <h3 className="font-display text-sm font-bold text-[--text]">Bills by policy area</h3>
              </div>
              <div className="p-4">
                <PolicyAreaPieChart data={policyAreas} />
              </div>
            </div>
          )}
        </div>
      )}

      {stats.totalVotes === 0 && (
        <div className="card p-8 text-center mb-6">
          <Users className="w-8 h-8 text-[--text-muted] mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold text-[--text] mb-1">No citizen activity yet in {stateName}</p>
          <p className="text-xs text-[--text-muted] mb-4">
            Be the first — vote on a bill and your activity will show up here.
          </p>
          <Link href="/bills" className="btn-primary text-xs px-4 py-2">Browse bills</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Bills */}
          {topBills.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
                <VoteIcon className="w-4 h-4 text-[--accent]" />
                <h2 className="font-display text-sm font-bold text-[--text]">Most-voted bills in {stateName}</h2>
              </div>
              <div className="divide-y divide-[--border]">
                {topBills.map((bill: any) => {
                  const cls = STATUS_CLS[bill.status] || STATUS_CLS.introduced
                  const b = bill.breakdown
                  const yesPct = b && b.total > 0 ? Math.round((b.yes / b.total) * 100) : 0
                  const noPct = b && b.total > 0 ? Math.round((b.no / b.total) * 100) : 0
                  return (
                    <Link key={bill.id} href={`/bills/${bill.id}`}
                      className="group flex items-start gap-3 px-5 py-3.5 hover:bg-[--surface-secondary] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="badge bg-[--dark] text-white text-[10px]">{bill.billType} {bill.billNumber}</span>
                          <span className={`badge border text-[10px] ${cls}`}>{bill.status.replace(/_/g, ' ')}</span>
                          {bill.policyArea && (
                            <span className="text-[10px] text-[--text-muted]">{bill.policyArea}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[--text] group-hover:text-[--accent] transition-colors leading-snug line-clamp-2">
                          {bill.shortTitle || bill.title}
                        </p>
                        {b && (
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[--text-muted]">
                            <span>{bill.voteCount} votes from {code}</span>
                            <span className="text-emerald-600 font-semibold">{yesPct}% yes</span>
                            <span className="text-red-600 font-semibold">{noPct}% no</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0 mt-1" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Discussions */}
          {discussions.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <h2 className="font-display text-sm font-bold text-[--text]">Recent discussions from {stateName}</h2>
              </div>
              <div className="divide-y divide-[--border]">
                {discussions.map((disc: any) => (
                  <Link key={disc.id} href={`/bills/${disc.bill.id}`}
                    className="group flex items-start gap-3 px-5 py-3.5 hover:bg-[--surface-secondary] transition-colors"
                  >
                    <div className="w-7 h-7 bg-purple-50 rounded-full flex items-center justify-center text-[10px] font-bold text-purple-600 shrink-0">
                      {(disc.user?.firstName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-[--text]">
                          {disc.user?.firstName || 'Citizen'} {(disc.user?.lastName || '').charAt(0)}.
                        </span>
                        <span className="text-[10px] text-[--text-muted]">{timeAgo(disc.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[--text-secondary] line-clamp-2 leading-relaxed">{disc.content}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border] text-[10px]">
                          {disc.bill.billType} {disc.bill.billNumber}
                        </span>
                        {disc._count.replies > 0 && (
                          <span className="text-[10px] text-[--text-muted]">{disc._count.replies} {disc._count.replies === 1 ? 'reply' : 'replies'}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* State legislature bills (renders only if OPENSTATES_API_KEY is set) */}
          <StateLegBills stateCode={code} stateName={stateName} />

          {/* Rep recent activity */}
          {repActivity.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[--accent]" />
                <h2 className="font-display text-sm font-bold text-[--text]">Recent rep activity</h2>
              </div>
              <div className="divide-y divide-[--border]">
                {repActivity.slice(0, 8).map((item: any, i: number) => {
                  const pos = item.position
                  const Icon = pos === 'yea' ? Check : pos === 'nay' ? X : Minus
                  const color = pos === 'yea' ? 'text-emerald-600 bg-emerald-50'
                              : pos === 'nay' ? 'text-red-600 bg-red-50'
                              : 'text-[--text-muted] bg-[--surface-secondary]'
                  const partyColor = item.rep.party === 'R' ? 'text-red-700' : item.rep.party === 'D' ? 'text-blue-700' : 'text-gray-600'
                  return (
                    <Link key={i} href={`/scorecards/${item.rep.bioguideId}`}
                      className="group flex items-center gap-3 px-5 py-3 hover:bg-[--surface-secondary] transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors">
                          {item.rep.fullName} <span className={`text-[10px] font-bold ${partyColor}`}>({item.rep.party})</span>
                        </p>
                        <p className="text-[11px] text-[--text-muted] line-clamp-1">
                          voted <span className="font-semibold uppercase">{pos === 'yea' ? 'Yea' : pos === 'nay' ? 'Nay' : pos}</span> on {item.bill.billType} {item.bill.billNumber} — {item.bill.shortTitle || item.bill.title}
                        </p>
                      </div>
                      {item.votedAt && (
                        <span className="text-[10px] text-[--text-muted] shrink-0 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {timeAgo(item.votedAt)}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — state's reps */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[--border]">
              <h3 className="font-display text-sm font-bold text-[--text]">Your delegation</h3>
            </div>
            <div className="p-4 space-y-5">
              {senators.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between mb-2.5">
                    <p className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider">Senate</p>
                    <span className="text-[10px] text-[--text-muted]">{senators.length} of 2</span>
                  </div>
                  <div className="space-y-2">
                    {senators.map((r: any) => <DelegationCard key={r.bioguideId} rep={r} />)}
                  </div>
                </div>
              )}

              {houseReps.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between mb-2.5">
                    <p className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider">House</p>
                    <span className="text-[10px] text-[--text-muted]">{houseReps.length} {houseReps.length === 1 ? 'seat' : 'seats'}</span>
                  </div>
                  <div className="space-y-2">
                    {houseReps.map((r: any) => <DelegationCard key={r.bioguideId} rep={r} />)}
                  </div>
                </div>
              )}

              {reps.length === 0 && (
                <p className="text-xs text-[--text-muted] text-center py-2">No representatives in our database yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

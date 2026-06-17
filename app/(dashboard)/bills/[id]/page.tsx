import { auth } from '@clerk/nextjs/server'
import { BillService } from '@/lib/services/billService'
import { UserService } from '@/lib/services/userService'
import { VoteService } from '@/lib/services/voteService'
import VotingPanel from '@/components/voting/VotingPanel'
import AISummary from '@/components/bills/AISummary'
import ProsConsPanel from '@/components/bills/ProsConsPanel'
import ImpactPanel from '@/components/bills/ImpactPanel'
import DiscussionBoard from '@/components/bills/DiscussionBoard'
import BillFullText from '@/components/bills/BillFullText'
import LobbyingPanel from '@/components/bills/LobbyingPanel'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Calendar, Zap, RefreshCw, LogIn } from 'lucide-react'
import SectionNav from '@/components/ui/SectionNav'
import ShareButton from '@/components/ui/ShareButton'
import FollowButton from '@/components/bills/FollowButton'
import BillStateSentiment from '@/components/bills/BillStateSentiment'
import BillImpactMap from '@/components/bills/BillImpactMap'
import BillTimeline from '@/components/bills/BillTimeline'
import CitizenImpact from '@/components/bills/CitizenImpact'
import TrustBar from '@/components/bills/TrustBar'
import BillTypeBadge from '@/components/bills/BillTypeBadge'
import RepVotesOnBill from '@/components/bills/RepVotesOnBill'
import RelatedBills from '@/components/bills/RelatedBills'
import BillNews from '@/components/bills/BillNews'
import BillChat from '@/components/bills/BillChat'
import PageViewTracker from '@/components/ui/PageViewTracker'

const SECTIONS = [
  { id: 'timeline',   label: 'Timeline' },
  { id: 'summary',    label: 'Summary' },
  { id: 'arguments',  label: 'Arguments' },
  { id: 'sentiment',  label: 'By State' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'chat', label: 'Live chat' },
]

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bill = await BillService.getBillById(id)
  if (!bill) return {}
  const title = `${bill.shortTitle || bill.title} | Democracy Unlocked`
  const rawSummary = bill.summary?.replace(/<[^>]+>/g, '').slice(0, 160) ?? ''
  const description = rawSummary || `AI summary, community vote, and rep breakdown for ${bill.billType} ${bill.billNumber}.`
  return {
    title,
    description,
    openGraph: {
      title: bill.shortTitle || bill.title,
      description,
      url: `https://www.democracyunlocked.com/bills/${id}`,
      type: 'article',
      images: [{ url: 'https://www.democracyunlocked.com/og-default.png', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  const user = userId ? await UserService.getCurrentUser() : null

  const { id } = await params
  const bill = await BillService.getBillById(id)
  if (!bill) notFound()

  const stats = await BillService.getBillVoteStats(id)
  const userVote = user ? await VoteService.getUserVote(user.id, id) : null
  const totalVotes = stats.totalVotes || 0
  const yesP = totalVotes > 0 ? Math.round((stats.yesCount / totalVotes) * 100) : 0
  const noP  = totalVotes > 0 ? Math.round((stats.noCount  / totalVotes) * 100) : 0
  const absP = totalVotes > 0 ? Math.round((stats.abstainCount / totalVotes) * 100) : 0

  const statusLabels: Record<string, { label: string; cls: string }> = {
    enacted:        { label: 'Enacted',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    passed_both:    { label: 'Passed Both',      cls: 'bg-green-50 text-green-700 border-green-200' },
    passed_chamber: { label: 'Passed Chamber',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    reported:       { label: 'Reported',         cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    in_committee:   { label: 'In Committee',     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    introduced:     { label: 'Introduced',       cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  }
  const st = statusLabels[bill.status] || statusLabels.introduced
  const congressGovUrl = `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.originChamber === 'senate' ? 'senate' : 'house'}-bill/${bill.billNumber}`

  return (
    <div>
      <PageViewTracker page="bill_detail" />
      <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-[--text-muted] hover:text-[--accent] font-medium mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Bills
      </Link>

      {/* Header */}
      <div className="hero-gradient rounded-2xl px-5 py-6 sm:px-8 sm:py-7 mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <BillTypeBadge billType={bill.billType} billNumber={bill.billNumber} className="bg-white/10 text-white border border-white/10" />
          <span className={`badge border ${st.cls}`}>{st.label}</span>
          {bill.policyArea && <span className="badge bg-[--accent]/20 text-[--accent-light] border border-[--accent]/20">{bill.policyArea}</span>}
          <span className="badge bg-white/5 text-white/60 border border-white/10">{bill.congress}th Congress</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-3">
          {bill.shortTitle || bill.title}
        </h1>
        {bill.shortTitle && bill.title !== bill.shortTitle && <p className="text-white/60 text-sm mb-3">{bill.title}</p>}
        <div className="flex items-center gap-5 text-sm text-white/70 flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Introduced {new Date(bill.introducedDate).toLocaleDateString()}</span>
          {(bill as any).latestActionDate && (
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Updated {new Date((bill as any).latestActionDate).toLocaleDateString()}
            </span>
          )}
          <a href={congressGovUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Congress.gov
          </a>
          <ShareButton
            url={`https://www.democracyunlocked.com/bills/${bill.id}`}
            title={bill.shortTitle || bill.title}
            text={`"${bill.shortTitle || bill.title}" — AI summary + cast your vote on Democracy Unlocked:`}
            label="Share bill"
            variant="pill"
            className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 hover:!border-white/30"
          />
          {user && <FollowButton billId={bill.id} className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 hover:!border-white/30" />}
        </div>
      </div>

      {bill.latestActionText && (
        <div className="card p-4 mb-4 flex items-start gap-2">
          <Zap className="w-4 h-4 text-[--accent] mt-0.5 shrink-0" />
          <p className="text-sm"><span className="font-semibold text-[--text]">Latest action:</span> <span className="text-[--text-secondary]">{bill.latestActionText}</span></p>
        </div>
      )}

      <TrustBar
        lastActionDate={(bill as any).latestActionDate?.toISOString() ?? null}
        lobbyingFirmCount={(bill as any).lobbyingFirmCount ?? null}
      />

      <SectionNav sections={SECTIONS} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div id="timeline" className="scroll-mt-20">
            <BillTimeline
              status={bill.status}
              actions={(bill as any).actions ?? []}
              sponsors={(bill.sponsors as any) ?? []}
              cosponsors={(bill.cosponsors as any) ?? []}
              introducedDate={bill.introducedDate}
              originChamber={bill.originChamber}
            />
          </div>
          <div id="summary" className="scroll-mt-20">
            <AISummary billId={bill.id} aiSummary={(bill as any).aiSummary} officialSummary={bill.summary} aiAnalyzedAt={(bill as any).aiAnalyzedAt?.toISOString() || null} />
          </div>
          <div id="arguments" className="scroll-mt-20 space-y-6">
            <ProsConsPanel prosCons={bill.prosCons as any} />
            <ImpactPanel impacts={bill.impacts as any} />
          </div>
          <div id="sentiment" className="scroll-mt-20 grid md:grid-cols-2 gap-6">
            <BillStateSentiment billId={bill.id} />
            <BillImpactMap billId={bill.id} />
          </div>
          <BillFullText billId={bill.id} initialText={(bill as any).fullText || null} congressGovUrl={congressGovUrl} />

          {Array.isArray(bill.sponsors) && bill.sponsors.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-[--border]"><h2 className="font-display text-sm font-bold text-[--text]">Sponsors</h2></div>
              <div className="p-5 grid sm:grid-cols-2 gap-3">
                {(bill.sponsors as any[]).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[--surface-secondary] rounded-lg">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${s.party === 'R' ? 'bg-red-500' : s.party === 'D' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                      {s.party || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[--text]">{s.fullName || `${s.firstName} ${s.lastName}`}</p>
                      <p className="text-xs text-[--text-muted]">{s.state}{s.district ? `-${s.district}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div id="discussion" className="scroll-mt-20">
            <DiscussionBoard billId={bill.id} />
          </div>
          {user && (
            <div id="chat" className="scroll-mt-20">
              <BillChat billId={bill.id} />
            </div>
          )}
        </div>

        <div className="space-y-6 order-first lg:order-last">
          {user ? (
            <>
              <div id="vote">
                <VotingPanel
                  billId={bill.id}
                  billTitle={bill.shortTitle || bill.title}
                  currentVote={userVote ? { position: userVote.position, reasoning: userVote.reasoning || undefined } : undefined}
                  communityStats={{ yesCount: stats.yesCount, noCount: stats.noCount, abstainCount: stats.abstainCount, totalVotes }}
                />
              </div>
              <RepVotesOnBill
                billId={bill.id}
                userState={user.state ?? null}
                userVotePosition={userVote?.position ?? null}
              />
            </>
          ) : (
            /* Ungated aha moment — show community stats + sign-up CTA */
            <div id="vote" className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[--border]">
                <h3 className="font-display text-sm font-bold text-[--text]">Add your voice</h3>
                <p className="text-xs text-[--text-muted] mt-0.5">{totalVotes} citizen{totalVotes !== 1 ? 's' : ''} have already voted</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Yes', pct: yesP, count: stats.yesCount, color: '#22C55E' },
                  { label: 'No',  pct: noP,  count: stats.noCount,  color: '#E5484D' },
                  { label: 'Abstain', pct: absP, count: stats.abstainCount, color: '#8A8F98' },
                ].map(v => (
                  <div key={v.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-[--text]">{v.label}</span>
                      <span className="text-sm font-semibold" style={{ color: v.color }}>{v.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[--surface-tertiary] overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${v.pct}%`, backgroundColor: v.color }} />
                    </div>
                  </div>
                ))}
                <Link href={`/sign-up?redirect_url=/bills/${bill.id}`}
                  className="btn-primary w-full text-center mt-4 flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign up to vote &amp; see your rep's position
                </Link>
                <p className="text-[10px] text-[--text-muted] text-center">Free · No spam · See how your representatives voted</p>
              </div>
            </div>
          )}

          <CitizenImpact totalVotes={totalVotes} />
          <LobbyingPanel bill={bill} />

          {/* Vote stats (always visible) */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[--border]"><h3 className="font-display text-sm font-bold text-[--text]">Public opinion</h3></div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Yes',     pct: yesP, count: stats.yesCount,     color: '#22C55E' },
                { label: 'No',      pct: noP,  count: stats.noCount,      color: '#E5484D' },
                { label: 'Abstain', pct: absP, count: stats.abstainCount, color: '#8A8F98' },
              ].map(v => (
                <div key={v.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-[--text]">{v.label}</span>
                    <span className="text-sm font-semibold" style={{ color: v.color }}>{v.pct}% <span className="text-[--text-muted] font-normal">({v.count})</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-[--surface-tertiary] overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${v.pct}%`, backgroundColor: v.color }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-[--border] text-center">
                <p className="text-sm text-[--text-muted]"><span className="font-semibold text-[--text]">{totalVotes}</span> citizen{totalVotes !== 1 ? 's' : ''} voted</p>
              </div>
            </div>
          </div>

          {bill.subjects && bill.subjects.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display text-sm font-bold text-[--text] mb-3">Topics</h3>
              <div className="flex flex-wrap gap-1.5">
                {bill.subjects.map((s: string, i: number) => (
                  <span key={i} className="badge bg-[--surface-secondary] text-[--text-secondary] border border-[--border]">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* External coverage — labeled by source lean, never curated */}
          <BillNews query={bill.shortTitle || bill.title} billCode={`${bill.billType} ${bill.billNumber}`} />

          {/* Cross-links — keep share-link visitors from dead-ending here */}
          <RelatedBills billId={bill.id} policyArea={bill.policyArea ?? null} />
        </div>
      </div>
    </div>
  )
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import { UserService } from '@/lib/services/userService'
import { VoteService } from '@/lib/services/voteService'
import VotingPanel from '@/components/voting/VotingPanel'
import AISummary from '@/components/bills/AISummary'
import ProsConsPanel from '@/components/bills/ProsConsPanel'
import ImpactPanel from '@/components/bills/ImpactPanel'
import DiscussionBoard from '@/components/bills/DiscussionBoard'
import BillFullText from '@/components/bills/BillFullText'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await UserService.getCurrentUser()
  if (!user) redirect('/sign-in')

  const { id } = await params
  const bill = await BillService.getBillById(id)
  if (!bill) notFound()

  const stats = await BillService.getBillVoteStats(id)
  const userVote = await VoteService.getUserVote(user.id, id)

  const totalVotes = stats.totalVotes || 0
  const yesPercent = totalVotes > 0 ? Math.round((stats.yesCount / totalVotes) * 100) : 0
  const noPercent = totalVotes > 0 ? Math.round((stats.noCount / totalVotes) * 100) : 0
  const abstainPercent = totalVotes > 0 ? Math.round((stats.abstainCount / totalVotes) * 100) : 0

  const statusConfig: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
    enacted: { label: 'Enacted', emoji: '✅', bg: 'bg-emerald-400/20', text: 'text-emerald-300' },
    passed_both: { label: 'Passed Both', emoji: '🏛️', bg: 'bg-green-400/20', text: 'text-green-300' },
    passed_chamber: { label: 'Passed Chamber', emoji: '📋', bg: 'bg-amber-400/20', text: 'text-amber-300' },
    reported: { label: 'Reported', emoji: '📝', bg: 'bg-blue-400/20', text: 'text-blue-300' },
    in_committee: { label: 'In Committee', emoji: '🔍', bg: 'bg-orange-400/20', text: 'text-orange-300' },
    introduced: { label: 'Introduced', emoji: '📌', bg: 'bg-gray-400/20', text: 'text-gray-300' },
  }
  const sc = statusConfig[bill.status] || statusConfig.introduced

  const congressGovUrl = `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.originChamber === 'senate' ? 'senate' : 'house'}-bill/${bill.billNumber}`

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back */}
      <Link href="/bills" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#6366F1] font-medium mb-6 transition-colors">
        ← Back to Bills
      </Link>

      {/* Hero Header */}
      <div className="relative mesh-bg rounded-3xl p-8 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[120px] opacity-15" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-[#6366F1] rounded-full filter blur-[100px] opacity-15" />

        <div className="relative z-10">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="inline-flex items-center px-3 py-1.5 bg-white/15 text-white text-sm font-bold rounded-lg backdrop-blur-sm">
              {bill.billType} {bill.billNumber}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${sc.bg} ${sc.text} text-sm font-bold rounded-lg backdrop-blur-sm`}>
              {sc.emoji} {sc.label}
            </span>
            {bill.policyArea && (
              <span className="inline-flex items-center px-3 py-1.5 bg-violet-400/20 text-violet-300 text-sm font-bold rounded-lg backdrop-blur-sm">
                {bill.policyArea}
              </span>
            )}
            <span className="inline-flex items-center px-3 py-1.5 bg-white/10 text-white/60 text-sm rounded-lg">
              {bill.congress}th Congress
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
            {bill.shortTitle || bill.title}
          </h1>
          {bill.shortTitle && bill.title !== bill.shortTitle && (
            <p className="text-white/40 text-sm mb-4 font-body">{bill.title}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-5 text-sm text-white/50 flex-wrap font-body">
            <span>📅 Introduced {new Date(bill.introducedDate).toLocaleDateString()}</span>
            {bill.latestActionDate && <span>⚡ Last action {new Date(bill.latestActionDate).toLocaleDateString()}</span>}
            <a href={congressGovUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              🔗 Congress.gov
            </a>
          </div>
        </div>
      </div>

      {/* Latest action banner */}
      {bill.latestActionText && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 mb-8">
          <p className="text-sm font-body">
            <span className="font-bold text-[#6366F1]">⚡ Latest Action:</span>{' '}
            <span className="text-indigo-800">{bill.latestActionText}</span>
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Summary */}
          <AISummary
            billId={bill.id}
            aiSummary={(bill as any).aiSummary}
            officialSummary={bill.summary}
            aiAnalyzedAt={(bill as any).aiAnalyzedAt?.toISOString() || null}
          />

          {/* Pros & Cons */}
          <ProsConsPanel prosCons={bill.prosCons as any} />

          {/* Impact Analysis */}
          <ImpactPanel impacts={bill.impacts as any} />

          {/* Full Bill Text */}
          <BillFullText
            billId={bill.id}
            initialText={(bill as any).fullText || null}
            congressGovUrl={congressGovUrl}
          />

          {/* Sponsors */}
          {Array.isArray(bill.sponsors) && bill.sponsors.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-display text-lg font-bold text-[#0F172A]">👥 Sponsors</h2>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-3">
                {(bill.sponsors as any[]).map((sponsor: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                      sponsor.party === 'R' ? 'bg-gradient-to-br from-red-400 to-red-500' :
                      sponsor.party === 'D' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {sponsor.party || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A] text-sm font-display">
                        {sponsor.fullName || `${sponsor.firstName} ${sponsor.lastName}`}
                      </p>
                      <p className="text-xs text-gray-400">{sponsor.state}{sponsor.district ? `-${sponsor.district}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion */}
          <DiscussionBoard billId={bill.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Voting */}
          <VotingPanel
            billId={bill.id}
            currentVote={userVote ? { position: userVote.position, reasoning: userVote.reasoning || undefined } : undefined}
          />

          {/* Vote Stats */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="font-display text-lg font-bold text-[#0F172A]">📊 Public Opinion</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Yes */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-[#0F172A]">✅ Yes</span>
                  <span className="text-sm font-bold text-emerald-600">{yesPercent}% <span className="font-normal text-gray-400">({stats.yesCount})</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-3 rounded-full transition-all duration-700" style={{ width: `${yesPercent}%` }} />
                </div>
              </div>
              {/* No */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-[#0F172A]">❌ No</span>
                  <span className="text-sm font-bold text-red-500">{noPercent}% <span className="font-normal text-gray-400">({stats.noCount})</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-400 to-rose-500 h-3 rounded-full transition-all duration-700" style={{ width: `${noPercent}%` }} />
                </div>
              </div>
              {/* Abstain */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-[#0F172A]">⏭️ Abstain</span>
                  <span className="text-sm font-bold text-gray-500">{abstainPercent}% <span className="font-normal text-gray-400">({stats.abstainCount})</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-300 to-gray-400 h-3 rounded-full transition-all duration-700" style={{ width: `${abstainPercent}%` }} />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-400 font-body">
                  <span className="font-bold text-[#0F172A]">{totalVotes}</span> citizen{totalVotes !== 1 ? 's' : ''} voted
                </p>
              </div>
            </div>
          </div>

          {/* Topics */}
          {bill.subjects && bill.subjects.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <h3 className="font-display font-bold text-[#0F172A] mb-3">🏷️ Topics</h3>
              <div className="flex flex-wrap gap-2">
                {bill.subjects.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-100">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

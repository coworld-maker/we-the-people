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
import { Calendar, FileText, User, ArrowLeft, ExternalLink, Scale } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await UserService.getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const { id } = await params
  const bill = await BillService.getBillById(id)
  
  if (!bill) {
    notFound()
  }

  const stats = await BillService.getBillVoteStats(id)
  const userVote = await VoteService.getUserVote(user.id, id)

  const totalVotes = stats.totalVotes || 0
  const yesPercent = totalVotes > 0 ? Math.round((stats.yesCount / totalVotes) * 100) : 0
  const noPercent = totalVotes > 0 ? Math.round((stats.noCount / totalVotes) * 100) : 0
  const abstainPercent = totalVotes > 0 ? Math.round((stats.abstainCount / totalVotes) * 100) : 0

  const statusColors: Record<string, string> = {
    enacted: 'bg-green-100 text-green-800 border-green-200',
    passed_chamber: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    passed_both: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    reported: 'bg-blue-100 text-blue-800 border-blue-200',
    in_committee: 'bg-orange-100 text-orange-800 border-orange-200',
    introduced: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const congressGovUrl = `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.originChamber === 'senate' ? 'senate' : 'house'}-bill/${bill.billNumber}`

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back link */}
      <Link
        href="/bills"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bills
      </Link>

      {/* Bill Header Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded-full backdrop-blur">
              {bill.billType} {bill.billNumber}
            </span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusColors[bill.status] || statusColors.introduced}`}>
              {bill.status.replace(/_/g, ' ')}
            </span>
            {bill.policyArea && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                {bill.policyArea}
              </span>
            )}
            <span className="px-3 py-1 bg-white/10 text-white/80 text-sm rounded-full">
              {bill.congress}th Congress
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
            {bill.shortTitle || bill.title}
          </h1>

          {bill.shortTitle && bill.title !== bill.shortTitle && (
            <p className="text-white/60 text-sm mb-4">{bill.title}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-white/70 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Introduced {new Date(bill.introducedDate).toLocaleDateString()}
            </div>
            {bill.latestActionDate && (
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Last action {new Date(bill.latestActionDate).toLocaleDateString()}
              </div>
            )}
            <a
              href={congressGovUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on Congress.gov
            </a>
          </div>
        </div>

        {bill.latestActionText && (
          <div className="px-8 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-sm">
              <span className="font-semibold text-blue-800">Latest Action:</span>{' '}
              <span className="text-blue-700">{bill.latestActionText}</span>
            </p>
          </div>
        )}
      </div>

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
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Sponsors</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-3">
                  {(bill.sponsors as any[]).map((sponsor: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        sponsor.party === 'R' ? 'bg-red-500' :
                        sponsor.party === 'D' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>
                        {sponsor.party || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {sponsor.fullName || `${sponsor.firstName} ${sponsor.lastName}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sponsor.state}{sponsor.district ? `-${sponsor.district}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Discussion Board */}
          <DiscussionBoard billId={bill.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Voting Panel */}
          <VotingPanel 
            billId={bill.id} 
            currentVote={userVote ? {
              position: userVote.position,
              reasoning: userVote.reasoning || undefined
            } : undefined}
          />

          {/* Vote Statistics */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Public Opinion</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-700">Yes</span>
                  <span className="text-sm font-bold text-green-600">
                    {yesPercent}% <span className="font-normal text-gray-400">({stats.yesCount})</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${yesPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-700">No</span>
                  <span className="text-sm font-bold text-red-600">
                    {noPercent}% <span className="font-normal text-gray-400">({stats.noCount})</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${noPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-700">Abstain</span>
                  <span className="text-sm font-bold text-gray-600">
                    {abstainPercent}% <span className="font-normal text-gray-400">({stats.abstainCount})</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-gray-300 to-gray-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${abstainPercent}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-center text-sm text-gray-500">
                  <span className="font-bold text-gray-900">{totalVotes}</span> citizen{totalVotes !== 1 ? 's' : ''} voted
                </p>
              </div>
            </div>
          </div>

          {/* Subjects/Tags */}
          {bill.subjects && bill.subjects.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-3">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {bill.subjects.map((subject: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

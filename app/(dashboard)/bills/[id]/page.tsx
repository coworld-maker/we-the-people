import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BillService } from '@/lib/services/billService'
import { UserService } from '@/lib/services/userService'
import { VoteService } from '@/lib/services/voteService'
import VotingPanel from '@/components/voting/VotingPanel'
import { Calendar, User, FileText } from 'lucide-react'
import { notFound } from 'next/navigation'

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bill Header */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">
                {bill.billType} {bill.billNumber}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded">
                {bill.status}
              </span>
              {bill.policyArea && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded">
                  {bill.policyArea}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {bill.title}
            </h1>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Introduced: {new Date(bill.introducedDate).toLocaleDateString()}
              </div>
              {bill.latestActionDate && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Last Action: {new Date(bill.latestActionDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {bill.summary && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {bill.summary}
              </p>
            </div>
          )}

          {/* Latest Action */}
          {bill.latestActionText && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Action</h2>
              <p className="text-gray-700">{bill.latestActionText}</p>
            </div>
          )}

          {/* Sponsors */}
          {Array.isArray(bill.sponsors) && bill.sponsors.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sponsors</h2>
              <div className="space-y-2">
                {bill.sponsors.map((sponsor: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {sponsor.fullName || `${sponsor.firstName} ${sponsor.lastName}`}
                      {sponsor.party && ` (${sponsor.party})`}
                      {sponsor.state && ` - ${sponsor.state}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Public Opinion
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Yes</span>
                  <span className="text-sm font-semibold text-green-600">
                    {yesPercent}% ({stats.yesCount})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${yesPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">No</span>
                  <span className="text-sm font-semibold text-red-600">
                    {noPercent}% ({stats.noCount})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${noPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Abstain</span>
                  <span className="text-sm font-semibold text-gray-600">
                    {abstainPercent}% ({stats.abstainCount})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full transition-all"
                    style={{ width: `${abstainPercent}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{totalVotes}</span> total votes cast
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserService } from '@/lib/services/userService'
import { VoteService } from '@/lib/services/voteService'
import { ThumbsUp, ThumbsDown, MinusCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await UserService.getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  const votes = await VoteService.getUserVotes(user.id, 10)
  const stats = await VoteService.getVoteStats(user.id)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{user.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-gray-600">
          Here's your civic engagement at a glance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Votes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Yes Votes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.yes}</p>
            </div>
            <ThumbsUp className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">No Votes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.no}</p>
            </div>
            <ThumbsDown className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Abstain</p>
              <p className="text-3xl font-bold text-gray-900">{stats.abstain}</p>
            </div>
            <MinusCircle className="w-10 h-10 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Recent Votes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Votes</h2>
          <Link 
            href="/bills" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Bills →
          </Link>
        </div>

        {votes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't voted on any bills yet.</p>
            <Link
              href="/bills"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Voting
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {votes.map((vote) => (
              <div
                key={vote.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {vote.bill.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vote.bill.congress} • {vote.bill.billType} {vote.bill.billNumber}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Voted {new Date(vote.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4">
                  {vote.position === 'yes' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Yes
                    </span>
                  )}
                  {vote.position === 'no' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      No
                    </span>
                  )}
                  {vote.position === 'abstain' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      Abstain
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

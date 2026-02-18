import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserService } from '@/lib/services/userService'
import { VoteService } from '@/lib/services/voteService'
import prisma from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await UserService.getCurrentUser()
  if (!user) redirect('/sign-in')

  const votes = await VoteService.getUserVotes(user.id, 10)
  const stats = await VoteService.getVoteStats(user.id)
  const [totalBills, totalPlatformVotes, totalUsers, trendingBills] = await Promise.all([
    prisma.bill.count(), prisma.vote.count(), prisma.user.count(),
    prisma.bill.findMany({ take: 5, orderBy: { votes: { _count: 'desc' } }, include: { _count: { select: { votes: true } } } }),
  ])
  const engagementPercent = totalBills > 0 ? Math.round((stats.total / totalBills) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome banner */}
      <div className="relative mesh-bg rounded-3xl p-8 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#6366F1] rounded-full filter blur-[80px] opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back{user.firstName ? `, ${user.firstName}` : ''}!
            </h1>
          </div>
          <p className="text-white/50 font-body ml-10">
            You&apos;ve voted on <span className="text-[#FF6B6B] font-semibold">{stats.total}</span> of <span className="text-white font-semibold">{totalBills}</span> bills
            {engagementPercent > 0 && <span className="ml-1">— <span className="text-[#84CC16] font-semibold">{engagementPercent}%</span> engagement 🔥</span>}
          </p>
          {stats.total === 0 && (
            <Link href="/bills" className="inline-flex items-center gap-2 mt-4 ml-10 px-6 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] text-white font-semibold rounded-full text-sm hover:shadow-lg hover:shadow-red-500/25 transition-all">
              Cast Your First Vote →
            </Link>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Your Votes', value: stats.total, emoji: '🗳️', color: 'from-[#6366F1] to-[#818CF8]', shadow: 'shadow-indigo-100' },
          { label: 'Yes', value: stats.yes, emoji: '✅', color: 'from-[#22C55E] to-[#4ADE80]', shadow: 'shadow-green-100' },
          { label: 'No', value: stats.no, emoji: '❌', color: 'from-[#EF4444] to-[#F87171]', shadow: 'shadow-red-100' },
          { label: 'Abstain', value: stats.abstain, emoji: '⏭️', color: 'from-[#94A3B8] to-[#CBD5E1]', shadow: 'shadow-gray-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-lg ${s.shadow} card-hover`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.emoji}</span>
              <div className={`w-8 h-8 bg-gradient-to-br ${s.color} rounded-lg`} />
            </div>
            <p className="font-display text-3xl font-extrabold text-[#0F172A]">{s.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Bills Tracked', value: totalBills, emoji: '📜', bg: 'bg-indigo-50', accent: 'text-indigo-600' },
          { label: 'Votes Cast', value: totalPlatformVotes, emoji: '🔥', bg: 'bg-rose-50', accent: 'text-rose-600' },
          { label: 'Citizens', value: totalUsers, emoji: '🇺🇸', bg: 'bg-emerald-50', accent: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.emoji}</span>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`font-display text-2xl font-extrabold ${s.accent}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent votes */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">Your Recent Votes</h2>
            <Link href="/bills" className="text-xs font-semibold text-[#6366F1] hover:text-[#4F46E5]">View All →</Link>
          </div>
          {votes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">🗳️</div>
              <p className="text-gray-400 mb-4 font-body">No votes yet — your voice matters!</p>
              <Link href="/bills" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all">Browse Bills →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {votes.map((vote: any) => (
                <Link key={vote.id} href={`/bills/${vote.bill?.id || vote.billId}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${vote.position === 'yes' ? 'bg-green-50' : vote.position === 'no' ? 'bg-red-50' : 'bg-gray-50'}`}>
                    {vote.position === 'yes' ? '✅' : vote.position === 'no' ? '❌' : '⏭️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{vote.bill?.title || 'Unknown Bill'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{vote.bill?.billType} {vote.bill?.billNumber} • {new Date(vote.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${vote.position === 'yes' ? 'bg-green-50 text-green-600' : vote.position === 'no' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {vote.position}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Trending */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">🔥 Trending</h2>
          </div>
          {trendingBills.filter((b: any) => b._count.votes > 0).length === 0 ? (
            <div className="p-8 text-center"><p className="text-sm text-gray-400">No trending bills yet</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {trendingBills.filter((b: any) => b._count.votes > 0).map((bill: any, i: number) => (
                <Link key={bill.id} href={`/bills/${bill.id}`} className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <span className="font-display font-extrabold text-lg text-gray-200 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] line-clamp-2 leading-snug">{bill.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{bill.billType} {bill.billNumber}</span>
                      <span className="text-xs text-gray-400">{bill._count.votes} votes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

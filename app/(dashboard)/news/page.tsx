import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  Zap, TrendingUp, MessageSquare, Vote as VoteIcon,
  Calendar, ChevronRight, Clock, FileText, Eye, MapPin,
} from 'lucide-react'
import { CongressAPI } from '@/lib/api/congress'
import { getRecentNews } from '@/lib/api/news'
import PressFeed from '@/components/news/PressFeed'

export const metadata = {
  title: 'News & Activity | Democracy Unlocked',
  description: 'Latest congressional activity and platform engagement.',
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  enacted:        { label: 'Enacted',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  passed_both:    { label: 'Passed Both',      cls: 'bg-green-50 text-green-700 border-green-200' },
  passed_chamber: { label: 'Passed Chamber',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  reported:       { label: 'Reported',         cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_committee:   { label: 'In Committee',     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  introduced:     { label: 'Introduced',       cls: 'bg-gray-50 text-gray-600 border-gray-200' },
}

function timeAgo(d: Date | string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(d).toLocaleDateString()
}

export default async function NewsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const userRow = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { state: true },
  })
  const userState = userRow?.state ?? null

  const [
    latestActions,
    trendingBills,
    recentDiscussions,
    platformStats,
    mostViewedIds,
    stateImpactBills,
  ] = await Promise.all([
    prisma.bill.findMany({
      where: { latestActionDate: { not: null } },
      orderBy: { latestActionDate: 'desc' },
      take: 10,
      select: {
        id: true, title: true, shortTitle: true, billType: true, billNumber: true,
        status: true, policyArea: true, latestActionText: true, latestActionDate: true,
      },
    }),
    prisma.bill.findMany({
      orderBy: { votes: { _count: 'desc' } },
      take: 5,
      include: { _count: { select: { votes: true, discussions: true } } },
    }),
    prisma.discussion.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: { select: { firstName: true, lastName: true } },
        bill: { select: { id: true, billType: true, billNumber: true, shortTitle: true } },
        _count: { select: { replies: true } },
      },
    }),
    Promise.all([
      prisma.bill.count(), prisma.vote.count(),
      prisma.user.count(), prisma.discussion.count(),
    ]),
    CongressAPI.fetchMostViewedBills(),
    userState
      ? prisma.bill.findMany({
          where: { stateImpacts: { path: [userState, 'score'], gte: 0.6 } },
          orderBy: { latestActionDate: 'desc' },
          take: 5,
          select: { id: true, title: true, shortTitle: true, billType: true, billNumber: true, status: true, policyArea: true },
        })
      : Promise.resolve([] as any[]),
  ])

  const [totalBills, totalVotes, totalUsers, totalDiscussions] = platformStats

  // Match Congress.gov most-viewed IDs against our DB
  const mostViewedBills = (
    await Promise.all(
      mostViewedIds.slice(0, 10).map(({ congress, billType, billNumber }) =>
        prisma.bill.findFirst({
          where: { congress, billType, billNumber },
          select: { id: true, title: true, shortTitle: true, billType: true, billNumber: true, status: true },
        })
      )
    )
  ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof prisma.bill.findFirst>>>[]

  const pressArticles = await getRecentNews(40)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-[--text]">News & Activity</h1>
        <p className="text-sm text-[--text-secondary] mt-1">Press coverage of Congress, plus platform engagement</p>
      </div>

      {/* Press coverage feed — the lead section */}
      <div className="mb-8">
        <PressFeed articles={pressArticles} />
      </div>

      {/* Platform pulse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FileText,    label: 'Bills tracked', value: totalBills,       accent: 'text-[--accent]' },
          { icon: VoteIcon,    label: 'Votes cast',    value: totalVotes,       accent: 'text-emerald-600' },
          { icon: MessageSquare, label: 'Comments',    value: totalDiscussions, accent: 'text-purple-600' },
          { icon: TrendingUp,  label: 'Citizens',      value: totalUsers,       accent: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-[--text-muted]" />
              <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`font-display text-2xl font-extrabold ${s.accent}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bills affecting user's state */}
          {stateImpactBills.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <h2 className="font-display text-sm font-bold text-[--text]">Affecting {userState}</h2>
                <span className="ml-auto text-xs text-[--text-muted]">High-impact bills for your state</span>
              </div>
              <div className="divide-y divide-[--border]">
                {stateImpactBills.map(bill => {
                  const st = STATUS_LABELS[bill.status] || STATUS_LABELS.introduced
                  return (
                    <Link key={bill.id} href={`/bills/${bill.id}`}
                      className="group flex items-center gap-4 px-6 py-4 hover:bg-[--surface-secondary] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge bg-[--dark] text-white">{bill.billType} {bill.billNumber}</span>
                          <span className={`badge border ${st.cls}`}>{st.label}</span>
                          {bill.policyArea && <span className="text-xs text-[--text-muted]">{bill.policyArea}</span>}
                        </div>
                        <p className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors leading-snug">
                          {bill.shortTitle || bill.title}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] shrink-0 transition-colors" />
                    </Link>
                  )
                })}
              </div>
              <div className="px-6 py-3 border-t border-[--border]">
                <Link href={`/bills?affectsState=1`} className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
                  All bills affecting {userState} →
                </Link>
              </div>
            </div>
          )}

          {/* Latest Congressional Actions */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[--accent]" />
              <h2 className="font-display text-sm font-bold text-[--text]">Latest Congressional Actions</h2>
            </div>
            <div className="divide-y divide-[--border]">
              {latestActions.map(bill => {
                const st = STATUS_LABELS[bill.status] || STATUS_LABELS.introduced
                return (
                  <Link key={bill.id} href={`/bills/${bill.id}`}
                    className="group flex items-start gap-4 px-6 py-4 hover:bg-[--surface-secondary] transition-colors"
                  >
                    <div className="w-10 h-10 bg-[--surface-secondary] rounded-lg flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[--accent-light] transition-colors">
                      <Zap className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="badge bg-[--dark] text-white">{bill.billType} {bill.billNumber}</span>
                        <span className={`badge border ${st.cls}`}>{st.label}</span>
                        {bill.policyArea && <span className="text-xs text-[--text-muted]">{bill.policyArea}</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors leading-snug mb-1">
                        {bill.shortTitle || bill.title}
                      </h3>
                      {bill.latestActionText && (
                        <p className="text-xs text-[--text-secondary] line-clamp-2 leading-relaxed">{bill.latestActionText}</p>
                      )}
                      {bill.latestActionDate && (
                        <p className="text-xs text-[--text-muted] mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(bill.latestActionDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[--text-muted] group-hover:text-[--accent] transition-colors shrink-0 mt-1" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Discussions */}
          {recentDiscussions.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <h2 className="font-display text-sm font-bold text-[--text]">Recent Discussions</h2>
              </div>
              <div className="divide-y divide-[--border]">
                {recentDiscussions.map(disc => (
                  <Link key={disc.id} href={`/bills/${disc.bill.id}`}
                    className="group flex items-start gap-3 px-6 py-4 hover:bg-[--surface-secondary] transition-colors"
                  >
                    <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 shrink-0">
                      {(disc.user.firstName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[--text]">
                          {disc.user.firstName || 'Citizen'} {(disc.user.lastName || '').charAt(0)}.
                        </span>
                        <span className="text-xs text-[--text-muted]">{timeAgo(disc.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[--text-secondary] line-clamp-2 leading-relaxed">{disc.content}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">
                          {disc.bill.billType} {disc.bill.billNumber}
                        </span>
                        {disc._count.replies > 0 && (
                          <span className="text-xs text-[--text-muted]">{disc._count.replies} {disc._count.replies === 1 ? 'reply' : 'replies'}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Most Viewed on Congress.gov */}
          {mostViewedBills.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-500" />
                <h2 className="font-display text-sm font-bold text-[--text]">Most Viewed on Congress.gov</h2>
              </div>
              <div className="divide-y divide-[--border]">
                {mostViewedBills.map((bill, i) => {
                  const st = STATUS_LABELS[bill.status] || STATUS_LABELS.introduced
                  return (
                    <Link key={bill.id} href={`/bills/${bill.id}`}
                      className="group flex items-start gap-3 px-6 py-4 hover:bg-[--surface-secondary] transition-colors"
                    >
                      <span className="font-display text-base font-extrabold text-[--text-muted] mt-0.5 w-5 text-center shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors line-clamp-2 leading-snug">
                          {bill.shortTitle || bill.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-[--text-muted]">{bill.billType} {bill.billNumber}</span>
                          <span className={`badge border ${st.cls} text-[10px]`}>{st.label}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="px-6 py-3 border-t border-[--border]">
                <a href="https://www.congress.gov/most-viewed-bills" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors flex items-center gap-1">
                  View full list on Congress.gov →
                </a>
              </div>
            </div>
          )}

          {/* Most Active on Platform */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h2 className="font-display text-sm font-bold text-[--text]">Most Active Bills</h2>
            </div>
            <div className="divide-y divide-[--border]">
              {trendingBills
                .filter(b => b._count.votes > 0)
                .map((bill, i) => (
                <Link key={bill.id} href={`/bills/${bill.id}`}
                  className="group flex items-start gap-3 px-6 py-4 hover:bg-[--surface-secondary] transition-colors"
                >
                  <span className="font-display text-base font-extrabold text-[--text-muted] mt-0.5 w-5 text-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[--text] group-hover:text-[--accent] transition-colors line-clamp-2 leading-snug">
                      {bill.shortTitle || bill.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[--text-muted]">
                      <span>{bill._count.votes} votes</span>
                      {bill._count.discussions > 0 && <span>{bill._count.discussions} comments</span>}
                    </div>
                  </div>
                </Link>
              ))}
              {trendingBills.filter(b => b._count.votes > 0).length === 0 && (
                <div className="px-6 py-6 text-center">
                  <p className="text-sm text-[--text-muted]">No votes yet. Be the first to vote on a bill.</p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-[--border]">
              <Link href="/bills?sort=most_voted" className="text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
                Browse all bills →
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div className="card p-5">
            <h3 className="font-display text-sm font-bold text-[--text] mb-3">Quick links</h3>
            <div className="space-y-2">
              {[
                { href: '/bills',              label: 'All bills',         desc: 'Browse and vote on legislation' },
                { href: '/bills?groupBy=policy', label: 'By policy area',  desc: 'Bills organized by topic' },
                { href: '/bills?recent=1',     label: 'Moving this week',  desc: 'Bills with recent action' },
                { href: '/my-representatives', label: 'Your reps',         desc: 'Alignment scorecard' },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center justify-between p-3 bg-[--surface-secondary] rounded-lg hover:bg-[--surface-tertiary] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-[--text] group-hover:text-[--accent] transition-colors">{link.label}</p>
                    <p className="text-xs text-[--text-muted]">{link.desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

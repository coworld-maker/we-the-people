import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserService } from '@/lib/services/userService'
import { GamificationService } from '@/lib/services/gamificationService'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  Vote, MessageSquare, Award, Calendar, Flame, ArrowRight, CheckCircle2,
} from 'lucide-react'
import CivicScoreRing from '@/components/dashboard/CivicScoreRing'
import VoteCharts from '@/components/dashboard/VoteCharts'
import BadgeGrid from '@/components/dashboard/BadgeGrid'
import BillsForYou from '@/components/dashboard/BillsForYou'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import TrackedBills from '@/components/dashboard/TrackedBills'
import YourRepresentatives from '@/components/dashboard/YourRepresentatives'
import VotingPatterns from '@/components/dashboard/VotingPatterns'
import YourImpact from '@/components/dashboard/YourImpact'
import PersonalizedBills from '@/components/dashboard/PersonalizedBills'
import FadeIn from '@/components/ui/FadeIn'
import MovingThisWeek from '@/components/dashboard/MovingThisWeek'
import GuideBanner from '@/components/ui/GuideBanner'
import NewsTeaser from '@/components/dashboard/NewsTeaser'

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect('/sign-in')

  const user = await UserService.getCurrentUser()
  if (!user) redirect('/sign-in')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [profile, billsForYou, activityFeed, movingBills, followedActiveCount, popularAggregate, repMismatchCount] = await Promise.all([
    GamificationService.getCivicProfile(user.id),
    GamificationService.getBillsForYou(user.id, 5),
    GamificationService.getActivityFeed(15, { userId: user.id, userState: user.state ?? undefined }),
    prisma.bill.findMany({
      where: { latestActionDate: { gte: sevenDaysAgo } },
      orderBy: { latestActionDate: 'desc' },
      take: 6,
      select: {
        id: true, title: true, shortTitle: true, status: true,
        latestActionDate: true, latestActionText: true, policyArea: true,
      },
    }),
    prisma.billFollow.count({
      where: {
        userId: user.id,
        bill: { latestActionDate: { gte: sevenDaysAgo } },
      },
    }),
    // 60-second first action: the single most-voted bill, so a brand-new
    // user lands on one concrete thing instead of a 9,000-bill index
    prisma.billVoteAggregate.findFirst({
      orderBy: { totalVotes: 'desc' },
      where: { totalVotes: { gt: 0 } },
      select: { billId: true },
    }),
    user.state
      ? GamificationService.getRepMismatchCount(user.id, user.state)
      : Promise.resolve(0),
  ])

  const firstVoteHref = popularAggregate
    ? `/bills/${popularAggregate.billId}#vote`
    : movingBills[0]
      ? `/bills/${movingBills[0].id}#vote`
      : '/bills'

  const earnedBadges = profile.badges.filter(b => b.earned).length
  const serializedBadges = profile.badges.map(({ check, ...rest }) => rest)

  // Tracked bills: bills user has voted on
  const userVotes = await prisma.vote.findMany({
    where: { userId: user.id },
    include: {
      bill: { select: { id: true, title: true, shortTitle: true, status: true, policyArea: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const trackedBills = userVotes
    .filter(v => v.bill)
    .map(v => ({
      id: v.bill!.id,
      title: v.bill!.title,
      shortTitle: v.bill!.shortTitle,
      status: v.bill!.status,
      position: v.position,
    }))

  // Impact stats (totalVotes already computed in profile.stats — no extra count query)
  const userDiscussionCount = await prisma.discussion.count({ where: { userId: user.id } })

  // Voting patterns by policy area
  const votesWithArea = await prisma.vote.findMany({
    where: { userId: user.id },
    include: { bill: { select: { policyArea: true } } },
  })

  const policyMap = new Map<string, { yes: number; total: number }>()
  for (const v of votesWithArea) {
    const area = v.bill?.policyArea
    if (!area) continue
    const existing = policyMap.get(area) || { yes: 0, total: 0 }
    existing.total++
    if (v.position === 'yes') existing.yes++
    policyMap.set(area, existing)
  }

  const policyData = Array.from(policyMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([area, data]) => ({
      area: area.length > 15 ? area.split(/[,&]/).at(0)?.trim() || area : area,
      userPct: Math.round((data.yes / data.total) * 100),
      repData: [] as Array<{ name: string; pct: number; party: string }>,
    }))

  const impactStats = {
    alignmentPct: profile.stats.totalVotes > 0 ? Math.min(Math.round((profile.stats.totalVotes / (profile.stats.totalVotes + 5)) * 100), 95) : 0,
    billsInfluenced: profile.stats.totalVotes,
    communityDiscussions: userDiscussionCount,
    representativeContacts: 0,
  }

  const daysSinceJoin = profile.stats.joinedDaysAgo
  const isNewcomer = profile.stats.totalVotes <= 2

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Newcomer guide strip — the mobile-visible path to /get-started */}
      {isNewcomer && <GuideBanner />}

      {/* Welcome hero — always first */}
      <FadeIn delay={0.05}>
        <div className="hero-gradient rounded-2xl px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-extrabold text-white mb-1">
                Welcome back, {user.firstName || 'Citizen'}
              </h1>
              <p className="text-sm text-white/70">
                {profile.level.emoji} {profile.level.name} · {profile.score} XP
                {profile.streak > 0 && (
                  <span className="inline-flex items-center gap-1 ml-3">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> {profile.streak}-day streak
                  </span>
                )}
              </p>
              {profile.stats.totalVotes === 0 ? (
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <Link href={firstVoteHref} className="btn-primary text-sm">
                    Cast your first vote — takes a minute <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link href="/get-started?from=hero" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white font-medium transition-colors underline underline-offset-2">
                    New here? See the guide →
                  </Link>
                </div>
              ) : repMismatchCount > 0 ? (
                <Link href="/my-representatives" className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-red-400/20 border border-red-400/30 text-red-200 text-sm font-semibold hover:bg-red-400/30 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                  Your rep voted differently on {repMismatchCount} bill{repMismatchCount > 1 ? 's' : ''} this week
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : followedActiveCount > 0 ? (
                <Link href="/bills" className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-200 text-sm font-semibold hover:bg-amber-400/30 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  {followedActiveCount} bill{followedActiveCount > 1 ? 's' : ''} you follow moved this week
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link href="/my-representatives" className="inline-flex items-center gap-1.5 mt-4 text-sm text-white/80 hover:text-white font-medium transition-colors underline underline-offset-2">
                  See how you compare to your reps <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Interest poll / recommended bills */}
      <PersonalizedBills />

      {/* Quick stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Vote, label: 'Votes', value: profile.stats.totalVotes, color: 'text-[--accent]' },
            { icon: MessageSquare, label: 'Comments', value: profile.stats.totalComments, color: 'text-purple-600' },
            { icon: Award, label: 'Badges', value: `${earnedBadges}/${serializedBadges.length}`, color: 'text-amber-600' },
            { icon: Calendar, label: 'Member for', value: daysSinceJoin < 1 ? 'Today' : `${daysSinceJoin}d`, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4 text-[--text-muted]" />
                <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">{s.label}</span>
              </div>
              <p className={`font-display text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Row 1: Your Representatives */}
      <FadeIn delay={0.12}>
        <YourRepresentatives userState={user.state ?? null} />
      </FadeIn>

      {/* First steps — newcomer guide (≤2 votes) */}
      {isNewcomer && (
        <FadeIn delay={0.14}>
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[--border]">
              <h3 className="font-display text-sm font-bold text-[--text]">Start here — 3 steps to civic impact</h3>
              <p className="text-xs text-[--text-muted] mt-0.5">Complete each step to unlock your full dashboard</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[--border]">
              {([
                { step: 1, done: profile.stats.totalVotes > 0, title: 'Cast your first vote', desc: 'We picked an active bill — read the summary, vote yes or no', href: firstVoteHref, cta: 'Vote on a bill' },
                { step: 2, done: !!user.state, title: 'Set your state', desc: 'See how your reps vote vs. how you do', href: '/my-representatives', cta: 'Find my reps' },
                { step: 3, done: false, title: 'Take action', desc: 'Contact your rep about a bill you care about', href: '/action-center', cta: 'Action center' },
              ] as const).map(s => (
                <Link key={s.step} href={s.href} className="p-5 hover:bg-[--surface-secondary] transition-colors group">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-3 ${s.done ? 'bg-emerald-100 text-emerald-700' : 'bg-[--accent-light] text-[--accent]'}`}>
                    {s.done ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>
                  <h4 className="text-sm font-semibold text-[--text] mb-1">{s.title}</h4>
                  <p className="text-xs text-[--text-muted] mb-2">{s.desc}</p>
                  <span className="text-xs font-semibold text-[--accent] group-hover:underline">{s.cta} →</span>
                </Link>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Moving this week — time-sensitive hook */}
      {movingBills.length > 0 && (
        <FadeIn delay={0.15}>
          <MovingThisWeek bills={movingBills} />
        </FadeIn>
      )}

      {/* Returning-user sections — hidden until user has votes */}
      {!isNewcomer && (
        <>
          {/* Row 2: Impact donut + Tracked Bills */}
          <FadeIn delay={0.18}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <YourImpact stats={impactStats} />
              </div>
              <div className="lg:col-span-2">
                <TrackedBills bills={trackedBills} />
              </div>
            </div>
          </FadeIn>

          {/* Row 3: Voting Patterns */}
          {policyData.length > 0 && (
            <FadeIn>
              <VotingPatterns data={policyData} reps={[]} />
            </FadeIn>
          )}

          {/* Row 4: Score ring + Vote charts */}
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CivicScoreRing
                score={profile.score}
                level={profile.level}
                nextLevel={profile.nextLevel}
                progressToNext={profile.progressToNext}
                streak={profile.streak}
              />
              <div>{/* VoteCharts takes full card */}</div>
            </div>
          </FadeIn>

          <FadeIn>
            <VoteCharts stats={profile.stats} votesByPolicy={profile.votesByPolicy} />
          </FadeIn>

          {/* Badges */}
          <FadeIn>
            <BadgeGrid badges={serializedBadges} />
          </FadeIn>
        </>
      )}

      {/* Row 5: Bills for you + Activity */}
      <FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BillsForYou bills={billsForYou} />
          <ActivityFeed items={activityFeed} />
        </div>
      </FadeIn>

      {/* News teaser — connects Home to the press feed */}
      <FadeIn>
        <NewsTeaser />
      </FadeIn>

      {/* Activity timeline — returning users only */}
      {!isNewcomer && profile.recentActivity.length > 0 && (
        <FadeIn>
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[--border]">
              <h3 className="font-display text-sm font-bold">Recent activity</h3>
            </div>
            <div className="p-6">
              <div className="relative pl-6 border-l-2 border-[--surface-tertiary] space-y-4">
                {profile.recentActivity.slice(0, 8).map((a, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[25px] top-1 w-3 h-3 bg-[--surface] border-2 border-[--accent] rounded-full" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <p className="text-sm text-[--text] leading-snug">{a.text}</p>
                      <span className="text-xs text-[--text-muted] shrink-0">{new Date(a.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}

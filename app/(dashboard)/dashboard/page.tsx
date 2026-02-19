import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserService } from '@/lib/services/userService'
import { GamificationService } from '@/lib/services/gamificationService'
import prisma from '@/lib/prisma'
import {
  Vote, MessageSquare, Award, Calendar, Flame,
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

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect('/sign-in')

  const user = await UserService.getCurrentUser()
  if (!user) redirect('/sign-in')

  const profile = await GamificationService.getCivicProfile(user.id)
  const recommended = await GamificationService.getBillsForYou(user.id, 5)
  const activity = await GamificationService.getActivityFeed(15)

  // Strip check functions from badges for client serialization
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

  // Impact stats
  const [userVoteCount, userDiscussionCount] = await Promise.all([
    prisma.vote.count({ where: { userId: user.id } }),
    prisma.discussion.count({ where: { userId: user.id } }),
  ])

  // Voting patterns by policy area (user's "yes" rate per area)
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

  // Get top 5 policy areas user has voted in
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
    billsInfluenced: userVoteCount,
    communityDiscussions: userDiscussionCount,
    representativeContacts: 0, // Future: track outbound contact actions
  }

  const daysSinceJoin = profile.stats.joinedDaysAgo

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="hero-gradient rounded-2xl px-8 py-7">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-extrabold text-white mb-1">
              Welcome back, {user.firstName || 'Citizen'}
            </h1>
            <p className="text-sm text-white/40">
              {profile.level.emoji} {profile.level.name} · {profile.score} XP
              {profile.streak > 0 && (
                <span className="inline-flex items-center gap-1 ml-3">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> {profile.streak}-day streak
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Vote, label: 'Votes', value: profile.stats.totalVotes, color: 'text-[--accent]' },
          { icon: MessageSquare, label: 'Comments', value: profile.stats.totalComments, color: 'text-purple-600' },
          { icon: Award, label: 'Badges', value: serializedBadges.filter((b: any) => b.earned).length, color: 'text-amber-600' },
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

      {/* Row 1: Impact donut + Tracked Bills */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <YourImpact stats={impactStats} />
        </div>
        <div className="lg:col-span-2">
          <TrackedBills bills={trackedBills} />
        </div>
      </div>

      {/* Row 2: Your Representatives */}
      <YourRepresentatives userState={null} />

      {/* Row 3: Voting Patterns */}
      {policyData.length > 0 && (
        <VotingPatterns data={policyData} reps={[]} />
      )}

      {/* Row 4: Score ring + Vote charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CivicScoreRing
          score={profile.score}
          level={profile.level}
          nextLevel={profile.nextLevel}
          progressToNext={profile.progressToNext}
          streak={profile.streak}
        />
        <VoteCharts stats={profile.stats} votesByPolicy={profile.votesByPolicy} />
      </div>

      {/* Badges */}
      <BadgeGrid badges={serializedBadges} />

      {/* Row 5: Bills for you + Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <BillsForYou bills={recommended} />
        <ActivityFeed items={activity} />
      </div>
    </div>
  )
}

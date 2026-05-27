import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserService } from '@/lib/services/userService'
import { GamificationService } from '@/lib/services/gamificationService'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  Vote, MessageSquare, Award, Calendar, Flame, ArrowRight,
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
import WelcomeGuide from '@/components/ui/WelcomeGuide'
import FadeIn from '@/components/ui/FadeIn'

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) redirect('/sign-in')

  const user = await UserService.getCurrentUser()
  if (!user) redirect('/sign-in')

  const [profile, billsForYou, activityFeed] = await Promise.all([
    GamificationService.getCivicProfile(user.id),
    GamificationService.getBillsForYou(user.id, 5),
    GamificationService.getActivityFeed(15),
  ])

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

  // Impact stats
  const [userVoteCount, userDiscussionCount] = await Promise.all([
    prisma.vote.count({ where: { userId: user.id } }),
    prisma.discussion.count({ where: { userId: user.id } }),
  ])

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
    billsInfluenced: userVoteCount,
    communityDiscussions: userDiscussionCount,
    representativeContacts: 0,
  }

  const daysSinceJoin = profile.stats.joinedDaysAgo

  return (
    <div className="max-w-6xl mx-auto space-y-6">

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
              {profile.stats.totalVotes === 0 && (
                <Link href="/bills" className="btn-primary mt-4 text-sm">
                  Cast your first vote <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </FadeIn>
      <WelcomeGuide />

      {/* Interest poll / personalized bills */}
      <FadeIn>
        <PersonalizedBills />
      </FadeIn>

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

      {/* Row 1: Impact donut + Tracked Bills */}
      <FadeIn delay={0.15}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <YourImpact stats={impactStats} />
          </div>
          <div className="lg:col-span-2">
            <TrackedBills bills={trackedBills} />
          </div>
        </div>
      </FadeIn>

      {/* Row 2: Your Representatives */}
      <FadeIn>
        <YourRepresentatives userState={null} />
      </FadeIn>

      {/* Row 3: Voting Patterns */}
      {policyData.length > 0 && (
        <FadeIn>
          <VotingPatterns data={policyData} reps={[]} />
        </FadeIn>
      )}

      {/* Row 4: Score ring + Vote charts */}
      <FadeIn>
        <div className="grid lg:grid-cols-2 gap-6">
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

      {/* Row 5: Bills for you + Activity */}
      <FadeIn>
        <div className="grid lg:grid-cols-2 gap-6">
          <BillsForYou bills={billsForYou} />
          <ActivityFeed items={activityFeed} />
        </div>
      </FadeIn>

      {/* Activity timeline */}
      {profile.recentActivity.length > 0 && (
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

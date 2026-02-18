import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserService } from '@/lib/services/userService'
import { GamificationService } from '@/lib/services/gamificationService'
import Link from 'next/link'
import CivicScoreRing from '@/components/dashboard/CivicScoreRing'
import VoteCharts from '@/components/dashboard/VoteCharts'
import BadgeGrid from '@/components/dashboard/BadgeGrid'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import BillsForYou from '@/components/dashboard/BillsForYou'
import { ArrowRight, Vote, MessageSquare, Award, Calendar } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await UserService.getCurrentUser()
  if (!user) redirect('/sign-in')

  const [profile, billsForYou, activityFeed] = await Promise.all([
    GamificationService.getCivicProfile(user.id),
    GamificationService.getBillsForYou(user.id, 5),
    GamificationService.getActivityFeed(15),
  ])

  const earnedBadges = profile.badges.filter(b => b.earned).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="hero-gradient rounded-2xl px-8 py-7">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            Welcome back{user.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {profile.level.emoji} {profile.level.name} · {profile.score} XP
            {profile.streak > 0 && <span className="text-[--success] ml-2">{profile.streak}-day streak</span>}
          </p>
          {profile.stats.totalVotes === 0 && (
            <Link href="/bills" className="btn-primary mt-4 text-sm">
              Cast your first vote <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Vote, label: 'Votes cast', value: profile.stats.totalVotes, accent: 'text-[--accent]' },
          { icon: MessageSquare, label: 'Comments', value: profile.stats.totalComments, accent: 'text-purple-600' },
          { icon: Award, label: 'Badges earned', value: `${earnedBadges}/${profile.badges.length}`, accent: 'text-amber-600' },
          { icon: Calendar, label: 'Member for', value: `${profile.stats.joinedDaysAgo}d`, accent: 'text-sky-600' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="w-4 h-4 text-[--text-muted]" />
              <span className="text-xs font-medium text-[--text-muted] uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`font-display text-2xl font-extrabold ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Civic Score */}
      <CivicScoreRing
        score={profile.score}
        level={profile.level}
        nextLevel={profile.nextLevel}
        progressToNext={profile.progressToNext}
        streak={profile.streak}
      />

      {/* Charts */}
      <VoteCharts stats={profile.stats} votesByPolicy={profile.votesByPolicy} />

      {/* Badges */}
      <BadgeGrid badges={profile.badges} />

      {/* Two-col: Recommendations + Feed */}
      <div className="grid lg:grid-cols-2 gap-6">
        <BillsForYou bills={billsForYou} />
        <ActivityFeed items={activityFeed} />
      </div>

      {/* Activity timeline */}
      {profile.recentActivity.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[--border]">
            <h3 className="font-display text-sm font-bold">Recent activity</h3>
          </div>
          <div className="p-6">
            <div className="relative pl-6 border-l-2 border-[--surface-tertiary] space-y-4">
              {profile.recentActivity.slice(0, 8).map((a, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[25px] w-3 h-3 bg-white border-2 border-[--accent] rounded-full" />
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-[--text]">{a.text}</p>
                    <span className="text-xs text-[--text-muted] shrink-0">{new Date(a.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

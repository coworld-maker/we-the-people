import prisma from '@/lib/prisma'

// ── LEVELS ──
const LEVELS = [
  { name: 'Newcomer', min: 0, max: 99, emoji: '🌱', color: '#94A3B8' },
  { name: 'Observer', min: 100, max: 249, emoji: '👀', color: '#38BDF8' },
  { name: 'Engaged Citizen', min: 250, max: 499, emoji: '🗳️', color: '#6366F1' },
  { name: 'Civic Leader', min: 500, max: 749, emoji: '⭐', color: '#F5A623' },
  { name: 'Democracy Champion', min: 750, max: 999, emoji: '🏆', color: '#E5484D' },
  { name: 'Founding Patriot', min: 1000, max: Infinity, emoji: '🦅', color: '#00D4AA' },
]

// ── BADGE DEFINITIONS ──
const BADGE_DEFS = [
  { id: 'first_vote', name: 'First Vote', emoji: '🗳️', desc: 'Cast your first vote', check: (d: any) => d.totalVotes >= 1 },
  { id: 'five_votes', name: 'Informed Voter', emoji: '📊', desc: 'Vote on 5 bills', check: (d: any) => d.totalVotes >= 5 },
  { id: 'ten_votes', name: 'Active Citizen', emoji: '🔥', desc: 'Vote on 10 bills', check: (d: any) => d.totalVotes >= 10 },
  { id: 'twenty_votes', name: 'Civic Warrior', emoji: '⚔️', desc: 'Vote on 20 bills', check: (d: any) => d.totalVotes >= 20 },
  { id: 'all_bills', name: 'Completionist', emoji: '🏅', desc: 'Vote on every available bill', check: (d: any) => d.totalVotes >= d.totalBills && d.totalBills > 0 },
  { id: 'first_comment', name: 'Voice Heard', emoji: '💬', desc: 'Post your first comment', check: (d: any) => d.totalComments >= 1 },
  { id: 'five_comments', name: 'Debater', emoji: '🎤', desc: 'Post 5 comments', check: (d: any) => d.totalComments >= 5 },
  { id: 'policy_explorer', name: 'Policy Explorer', emoji: '🧭', desc: 'Vote across 3+ policy areas', check: (d: any) => d.policyAreas >= 3 },
  { id: 'policy_expert', name: 'Policy Expert', emoji: '🎓', desc: 'Vote across 5+ policy areas', check: (d: any) => d.policyAreas >= 5 },
  { id: 'bipartisan', name: 'Open Mind', emoji: '🤝', desc: 'Vote both yes and no on different bills', check: (d: any) => d.hasYes && d.hasNo },
  { id: 'streak_3', name: 'On a Roll', emoji: '🔥', desc: '3-day activity streak', check: (d: any) => d.streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', emoji: '💪', desc: '7-day activity streak', check: (d: any) => d.streak >= 7 },
]

export interface CivicProfile {
  score: number
  level: typeof LEVELS[number]
  nextLevel: typeof LEVELS[number] | null
  progressToNext: number
  badges: Array<typeof BADGE_DEFS[number] & { earned: boolean }>
  streak: number
  stats: {
    totalVotes: number
    yesVotes: number
    noVotes: number
    abstainVotes: number
    totalComments: number
    policyAreas: number
    favoritePolicy: string | null
    joinedDaysAgo: number
  }
  votesByPolicy: Array<{ policy: string; count: number }>
  recentActivity: Array<{ type: string; text: string; date: string; emoji: string }>
}

export class GamificationService {
  static async getCivicProfile(userId: string): Promise<CivicProfile> {
    const [votes, comments, totalBills, user] = await Promise.all([
      prisma.vote.findMany({
        where: { userId },
        include: { bill: { select: { policyArea: true, title: true, billType: true, billNumber: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.discussion.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.bill.count(),
      prisma.user.findUnique({ where: { id: userId } }),
    ])

    const totalVotes = votes.length
    const yesVotes = votes.filter(v => v.position === 'yes').length
    const noVotes = votes.filter(v => v.position === 'no').length
    const abstainVotes = votes.filter(v => v.position === 'abstain').length
    const totalComments = comments.length

    const policyMap = new Map<string, number>()
    votes.forEach(v => {
      const area = v.bill?.policyArea || 'Other'
      policyMap.set(area, (policyMap.get(area) || 0) + 1)
    })
    const votesByPolicy = Array.from(policyMap.entries())
      .map(([policy, count]) => ({ policy, count }))
      .sort((a, b) => b.count - a.count)

    const policyAreas = policyMap.size
    const favoritePolicy = votesByPolicy[0]?.policy || null

    const streak = this.calculateStreak(votes, comments)

    const joinedDaysAgo = user?.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000)
      : 0

    let score = 0
    score += totalVotes * 20
    score += totalComments * 10
    score += policyAreas * 15
    score += Math.min(streak, 30) * 5
    score = Math.min(score, 1500)

    const level = LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0]
    const levelIdx = LEVELS.indexOf(level)
    const nextLevel = levelIdx < LEVELS.length - 1 ? LEVELS[levelIdx + 1] : null
    const progressToNext = nextLevel
      ? Math.round(((score - level.min) / (nextLevel.min - level.min)) * 100)
      : 100

    const badgeData = {
      totalVotes, totalComments, totalBills, policyAreas, streak,
      hasYes: yesVotes > 0, hasNo: noVotes > 0,
    }
    const badges = BADGE_DEFS.map(b => ({ ...b, earned: b.check(badgeData) }))

    const activities: Array<{ type: string; text: string; date: string; emoji: string }> = []
    votes.slice(0, 5).forEach(v => {
      activities.push({
        type: 'vote',
        text: `Voted ${v.position} on ${v.bill?.billType} ${v.bill?.billNumber}`,
        date: v.createdAt.toISOString(),
        emoji: v.position === 'yes' ? '✅' : v.position === 'no' ? '❌' : '⏭️',
      })
    })
    comments.slice(0, 5).forEach(c => {
      activities.push({
        type: 'comment',
        text: 'Posted a comment',
        date: c.createdAt.toISOString(),
        emoji: '💬',
      })
    })
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
      score, level, nextLevel, progressToNext, badges, streak,
      stats: { totalVotes, yesVotes, noVotes, abstainVotes, totalComments, policyAreas, favoritePolicy, joinedDaysAgo },
      votesByPolicy,
      recentActivity: activities.slice(0, 10),
    }
  }

  private static calculateStreak(
    votes: Array<{ createdAt: Date }>,
    comments: Array<{ createdAt: Date }>
  ): number {
    const dates = new Set<string>()
    votes.forEach(v => dates.add(new Date(v.createdAt).toISOString().split('T')[0]))
    comments.forEach(c => dates.add(new Date(c.createdAt).toISOString().split('T')[0]))

    if (dates.size === 0) return 0

    const sorted = Array.from(dates).sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (sorted[0] !== today && sorted[0] !== yesterday) return 0

    let streak = 1
    for (let i = 1; i < sorted.length; i++) {
      const curr = new Date(sorted[i - 1])
      const prev = new Date(sorted[i])
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
      if (diffDays === 1) streak++
      else break
    }
    return streak
  }

  static async getBillsForYou(userId: string, limit: number = 5) {
    const userVotes = await prisma.vote.findMany({
      where: { userId },
      select: { billId: true, bill: { select: { policyArea: true } } },
    })

    const votedBillIds = userVotes.map(v => v.billId)
    const policyCount = new Map<string, number>()
    userVotes.forEach(v => {
      const area = v.bill?.policyArea
      if (area) policyCount.set(area, (policyCount.get(area) || 0) + 1)
    })

    const topPolicies = Array.from(policyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([p]) => p)

    let recommended = await prisma.bill.findMany({
      where: {
        id: { notIn: votedBillIds },
        ...(topPolicies.length > 0 ? { policyArea: { in: topPolicies } } : {}),
      },
      include: { _count: { select: { votes: true } } },
      orderBy: { votes: { _count: 'desc' } },
      take: limit,
    })

    if (recommended.length < limit) {
      const moreIds = recommended.map(b => b.id)
      const more = await prisma.bill.findMany({
        where: { id: { notIn: [...votedBillIds, ...moreIds] } },
        include: { _count: { select: { votes: true } } },
        orderBy: { introducedDate: 'desc' },
        take: limit - recommended.length,
      })
      recommended = [...recommended, ...more]
    }

    return recommended
  }

  static async getActivityFeed(
    limit: number = 15,
    opts?: { userId?: string; userState?: string }
  ) {
    const [recentVotes, recentComments] = await Promise.all([
      prisma.vote.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bill: { select: { title: true, billType: true, billNumber: true } },
          user: { select: { firstName: true } },
        },
      }),
      prisma.discussion.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bill: { select: { title: true, billType: true, billNumber: true } },
          user: { select: { firstName: true } },
        },
      }),
    ])

    const feed: Array<{
      id: string; type: string; emoji: string; text: string
      billId: string; date: string; user: string
    }> = []

    recentVotes.forEach(v => {
      feed.push({
        id: `v-${v.id}`,
        type: 'vote',
        emoji: v.position === 'yes' ? '✅' : v.position === 'no' ? '❌' : '⏭️',
        text: `voted ${v.position} on ${v.bill?.billType} ${v.bill?.billNumber}`,
        billId: v.billId,
        date: v.createdAt.toISOString(),
        user: v.user?.firstName || 'A citizen',
      })
    })

    recentComments.forEach(c => {
      feed.push({
        id: `c-${c.id}`,
        type: 'comment',
        emoji: '💬',
        text: `commented on ${c.bill?.billType} ${c.bill?.billNumber}`,
        billId: c.billId,
        date: c.createdAt.toISOString(),
        user: c.user?.firstName || 'A citizen',
      })
    })

    // Rep-mismatch items: your rep voted against your position
    if (opts?.userId && opts?.userState) {
      const mismatches = await this.computeRepMismatches(opts.userId, opts.userState, { take: 10 })
      for (const m of mismatches) {
        feed.push({
          id: `mm-${m.id}`,
          type: 'rep_mismatch',
          emoji: '⚡',
          text: `${m.repName} voted ${m.position === 'Yea' ? 'YES' : 'NO'} on ${m.billType} ${m.billNumber} — opposite of you`,
          billId: m.billId,
          date: m.createdAt.toISOString(),
          user: 'Your rep',
        })
      }
    }

    return feed
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  /**
   * Count of bills this user's current reps voted opposite to the user, within
   * the last `sinceDays` (default 7). Unlike deriving the count from the sliced
   * activity feed, this is date-bounded and not truncated — so "this week" copy
   * built on it is accurate.
   */
  static async getRepMismatchCount(
    userId: string,
    userState: string,
    sinceDays: number = 7
  ): Promise<number> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
    const mismatches = await this.computeRepMismatches(userId, userState, { since })
    return mismatches.length
  }

  /**
   * Shared rep-vote-vs-user-vote mismatch detection. Returns one entry per bill
   * where a current state rep voted opposite the user's recorded position.
   */
  private static async computeRepMismatches(
    userId: string,
    userState: string,
    opts: { since?: Date; take?: number } = {}
  ): Promise<Array<{
    id: string; billId: string; position: string; createdAt: Date
    billType?: string; billNumber?: string; repName: string
  }>> {
    const [userVotes, stateReps] = await Promise.all([
      prisma.vote.findMany({
        where: { userId },
        select: { billId: true, position: true },
      }),
      prisma.representative.findMany({
        where: { state: userState, currentTerm: true },
        select: { bioguideId: true, fullName: true },
      }),
    ])

    if (userVotes.length === 0 || stateReps.length === 0) return []

    const votedBillIds = userVotes.map(v => v.billId)
    const repBioguideIds = stateReps.map(r => r.bioguideId)
    const congressVotes = await prisma.congressVote.findMany({
      where: {
        billId: { in: votedBillIds },
        bioguideId: { in: repBioguideIds },
        ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
      },
      include: { bill: { select: { id: true, billType: true, billNumber: true } } },
      orderBy: { createdAt: 'desc' },
      ...(opts.take ? { take: opts.take } : {}),
    })

    const userVoteMap = new Map(userVotes.map(v => [v.billId, v.position]))
    const repNameMap = new Map(stateReps.map(r => [r.bioguideId, r.fullName]))

    const results: Array<{
      id: string; billId: string; position: string; createdAt: Date
      billType?: string; billNumber?: string; repName: string
    }> = []
    const seenBills = new Set<string>()

    for (const cv of congressVotes) {
      const myPos = userVoteMap.get(cv.billId)
      const repName = repNameMap.get(cv.bioguideId)
      if (!myPos || !repName) continue
      const isMismatch = (myPos === 'yes' && cv.position === 'Nay') || (myPos === 'no' && cv.position === 'Yea')
      if (!isMismatch) continue
      // One entry per bill, so the count reflects distinct bills, not roll calls.
      if (seenBills.has(cv.billId)) continue
      seenBills.add(cv.billId)
      results.push({
        id: cv.id,
        billId: cv.billId,
        position: cv.position,
        createdAt: cv.createdAt,
        billType: cv.bill?.billType,
        billNumber: cv.bill?.billNumber,
        repName,
      })
    }

    return results
  }
}

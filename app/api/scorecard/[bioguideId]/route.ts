// app/api/scorecard/[bioguideId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bioguideId } = await params

  // Get user's DB id
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ── 0. Rep profile from DB ─────────────────────────────────────────────────
  const repProfile = await prisma.representative.findUnique({
    where: { bioguideId },
    select: {
      bioguideId: true, firstName: true, lastName: true, fullName: true,
      party: true, state: true, district: true, chamber: true,
      termStart: true, committees: true,
    },
  })

  // ── 1. Voting records ──────────────────────────────────────────────────────
  const congressVotes = await prisma.congressVote.findMany({
    where: { bioguideId },
    orderBy: { votedAt: 'desc' },
    take: 100,
  })

  const billIds = congressVotes.map(v => v.billId)

  const [bills, sponsoredBillsRaw] = await Promise.all([
    billIds.length > 0
      ? prisma.bill.findMany({
          where: { id: { in: billIds } },
          select: {
            id: true, title: true, shortTitle: true, billType: true,
            billNumber: true, policyArea: true, status: true,
            introducedDate: true, latestActionText: true,
          },
        })
      : Promise.resolve([]),

    // ── 5. Sponsored bills — JSON text search on sponsors field ───────────
    prisma.$queryRaw<Array<{
      id: string; title: string; shortTitle: string | null;
      billType: string; billNumber: string; status: string;
      policyArea: string | null; introducedDate: Date;
    }>>`
      SELECT id, title, "shortTitle", "billType", "billNumber",
             status, "policyArea", "introducedDate"
      FROM   "Bill"
      WHERE  sponsors::text LIKE ${`%${bioguideId}%`}
      ORDER  BY "introducedDate" DESC
      LIMIT  20
    `,
  ])

  const billMap = new Map(bills.map(b => [b.id, b]))

  const votingRecords = congressVotes
    .map(v => ({
      billId: v.billId,
      position: v.position,
      chamber: v.chamber,
      rollNumber: v.rollNumber,
      votedAt: v.votedAt,
      bill: billMap.get(v.billId) ?? null,
    }))
    .filter(v => v.bill !== null)

  // ── 2. Key positions ───────────────────────────────────────────────────────
  const policyAreaMap: Record<string, { yea: number; nay: number; total: number }> = {}
  for (const v of votingRecords) {
    const area = v.bill?.policyArea ?? 'Other'
    if (!policyAreaMap[area]) policyAreaMap[area] = { yea: 0, nay: 0, total: 0 }
    policyAreaMap[area].total++
    if (v.position === 'yea') policyAreaMap[area].yea++
    if (v.position === 'nay') policyAreaMap[area].nay++
  }

  const keyPositions = Object.entries(policyAreaMap)
    .map(([area, counts]) => ({
      policyArea: area,
      yeaPct: counts.total > 0 ? Math.round((counts.yea / counts.total) * 100) : 0,
      nayPct: counts.total > 0 ? Math.round((counts.nay / counts.total) * 100) : 0,
      totalVotes: counts.total,
      lean: counts.yea > counts.nay ? 'supportive' : counts.nay > counts.yea ? 'opposing' : 'mixed',
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 8)

  // ── 3. Alignment score ────────────────────────────────────────────────────
  const userVotes = await prisma.vote.findMany({
    where: { userId: user.id, billId: { in: billIds } },
    select: { billId: true, position: true },
  })

  const userVoteMap = new Map(userVotes.map(v => [v.billId, v.position]))
  const memberVoteMap = new Map(congressVotes.map(v => [v.billId, v.position]))

  let matched = 0, total = 0
  const alignmentDetails: any[] = []

  for (const [billId, userPos] of userVoteMap) {
    const memberPos = memberVoteMap.get(billId)
    if (!memberPos || userPos === 'abstain') continue
    total++
    const normalizedUser = userPos === 'for' ? 'yea' : userPos === 'against' ? 'nay' : userPos
    const aligned = normalizedUser === memberPos
    if (aligned) matched++
    const bill = billMap.get(billId)
    if (bill) {
      alignmentDetails.push({
        billId, billType: bill.billType, billNumber: bill.billNumber,
        billTitle: bill.title, userPosition: userPos, memberPosition: memberPos, aligned,
      })
    }
  }

  // ── 4. Community comparison ────────────────────────────────────────────────
  // Fetch all the aggregates in one query instead of one findUnique per vote
  // (was N round-trips per scorecard load).
  const recentVotes = votingRecords.slice(0, 10)
  const aggRows = await prisma.billVoteAggregate.findMany({
    where: { billId: { in: recentVotes.filter(v => v.bill).map(v => v.billId) } },
  })
  const aggMap = new Map(aggRows.map(a => [a.billId, a]))

  const communityComparison: any[] = []
  for (const v of recentVotes) {
    if (!v.bill) continue
    const agg = aggMap.get(v.billId)
    if (!agg || agg.totalVotes === 0) continue
    const communityYeaPct = Math.round((agg.yesCount / agg.totalVotes) * 100)
    const memberYea = v.position === 'yea'
    communityComparison.push({
      billId: v.billId,
      billTitle: v.bill.title,
      billType: v.bill.billType,
      billNumber: v.bill.billNumber,
      memberPosition: v.position,
      communityYeaPct,
      communityNayPct: Math.round((agg.noCount / agg.totalVotes) * 100),
      totalCommunityVotes: agg.totalVotes,
      memberAlignedWithCommunity:
        (memberYea && communityYeaPct >= 50) || (!memberYea && communityYeaPct < 50),
    })
  }

  // ── 6. Party-line voting ───────────────────────────────────────────────────
  // For each bill this rep voted (yea/nay only), find how their party voted
  // majority, and check if the rep voted with it.
  let partyLineMatched = 0, partyLineTotal = 0

  if (repProfile && billIds.length > 0) {
    const myParty = repProfile.party
    // Get all party members' votes on these bills
    const partyVotes = await prisma.congressVote.findMany({
      where: {
        billId: { in: billIds },
        position: { in: ['yea', 'nay'] },
      },
      select: { billId: true, bioguideId: true, position: true },
    })

    // Build bill → { yeaIds, nayIds } for party members
    const partyBillMap = new Map<string, { yea: Set<string>; nay: Set<string> }>()
    for (const pv of partyVotes) {
      if (!partyBillMap.has(pv.billId)) partyBillMap.set(pv.billId, { yea: new Set(), nay: new Set() })
      const entry = partyBillMap.get(pv.billId)!
      if (pv.position === 'yea') entry.yea.add(pv.bioguideId)
      else entry.nay.add(pv.bioguideId)
    }

    // For each rep's yea/nay vote, check party majority
    for (const v of congressVotes) {
      if (v.position !== 'yea' && v.position !== 'nay') continue
      const entry = partyBillMap.get(v.billId)
      if (!entry) continue
      const partyYea = entry.yea.size
      const partyNay = entry.nay.size
      if (partyYea === partyNay) continue // tie — skip
      const partyMajority = partyYea > partyNay ? 'yea' : 'nay'
      partyLineTotal++
      if (v.position === partyMajority) partyLineMatched++
    }
  }

  const partyLinePct = partyLineTotal > 0
    ? Math.round((partyLineMatched / partyLineTotal) * 100)
    : null

  // ── Attendance (full record, not just the recent-votes window) ─────────────
  // Attendance = showed up to vote at all (yea / nay / present); absent =
  // not_voting. Computed over the member's ENTIRE CongressVote history via a
  // single grouped count, so it reflects a genuine attendance record rather
  // than the most-recent-100 slice the rest of the scorecard is built from.
  const attendanceRows = await prisma.congressVote.groupBy({
    by: ['position'],
    where: { bioguideId },
    _count: { position: true },
  })
  const votesEligible = attendanceRows.reduce((sum, r) => sum + r._count.position, 0)
  const votesMissed = attendanceRows.find(r => r.position === 'not_voting')?._count.position ?? 0
  const attendanceRate = votesEligible > 0
    ? Math.round(((votesEligible - votesMissed) / votesEligible) * 100)
    : null

  // ── Stats summary ──────────────────────────────────────────────────────────
  const yeaCount = votingRecords.filter(v => v.position === 'yea').length
  const nayCount = votingRecords.filter(v => v.position === 'nay').length
  const notVotingCount = votingRecords.filter(v => v.position === 'not_voting').length
  const totalVotesTracked = votingRecords.length
  const participationRate = totalVotesTracked > 0
    ? Math.round(((yeaCount + nayCount) / totalVotesTracked) * 100)
    : null

  return NextResponse.json({
    bioguideId,
    repProfile,
    votingRecords,
    keyPositions,
    sponsoredBills: sponsoredBillsRaw,
    alignment: {
      score: total > 0 ? Math.round((matched / total) * 100) : null,
      matched, total, details: alignmentDetails,
    },
    communityComparison,
    stats: {
      totalVotesTracked,
      yeaCount, nayCount, notVotingCount,
      participationRate,
      attendanceRate,
      votesEligible,
      votesMissed,
      partyLinePct,
      partyLineTotal,
    },
  })
}

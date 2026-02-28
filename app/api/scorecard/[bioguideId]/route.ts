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

  // 1. Voting records — how this member voted on bills in our DB
  const congressVotes = await prisma.congressVote.findMany({
    where: { bioguideId },
    orderBy: { votedAt: 'desc' },
    take: 50,
  })

  // Get bill details for those votes
  const billIds = congressVotes.map(v => v.billId)
  const bills = billIds.length > 0
    ? await prisma.bill.findMany({
        where: { id: { in: billIds } },
        select: { id: true, title: true, billType: true, billNumber: true, policyArea: true, status: true, introducedDate: true },
      })
    : []

  const billMap = new Map(bills.map(b => [b.id, b]))

  const votingRecords = congressVotes.map(v => ({
    billId: v.billId,
    position: v.position,
    chamber: v.chamber,
    rollNumber: v.rollNumber,
    votedAt: v.votedAt,
    bill: billMap.get(v.billId) ?? null,
  })).filter(v => v.bill !== null)

  // 2. Key positions — aggregate votes by policy area
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

  // 3. Alignment score — compare user votes vs member votes
  const userVotes = await prisma.vote.findMany({
    where: { userId: user.id, billId: { in: billIds } },
    select: { billId: true, position: true },
  })

  const userVoteMap = new Map(userVotes.map(v => [v.billId, v.position]))
  const memberVoteMap = new Map(congressVotes.map(v => [v.billId, v.position]))

  let matched = 0
  let total = 0
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
        billId,
        billType: bill.billType,
        billNumber: bill.billNumber,
        billTitle: bill.title,
        userPosition: userPos,
        memberPosition: memberPos,
        aligned,
      })
    }
  }

  const alignmentScore = total > 0 ? Math.round((matched / total) * 100) : null

  // 4. Community comparison — how the community voted vs this member
  const communityComparison: any[] = []
  for (const v of votingRecords.slice(0, 10)) {
    if (!v.bill) continue
    const agg = await prisma.billVoteAggregate.findUnique({ where: { billId: v.billId } })
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

  return NextResponse.json({
    bioguideId,
    votingRecords,
    keyPositions,
    alignment: {
      score: alignmentScore,
      matched,
      total,
      details: alignmentDetails,
    },
    communityComparison,
    stats: {
      totalVotesTracked: votingRecords.length,
      yeaCount: votingRecords.filter(v => v.position === 'yea').length,
      nayCount: votingRecords.filter(v => v.position === 'nay').length,
      notVotingCount: votingRecords.filter(v => v.position === 'not_voting').length,
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { abbrToName } from '@/lib/utils/state-codes'

const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code: raw } = await params
  const code = raw.toUpperCase()
  if (!VALID_STATES.has(code)) {
    return NextResponse.json({ error: 'Invalid state code' }, { status: 400 })
  }

  // ── State citizens (just a count for the hero) ─────────────────────────────
  const citizenCount = await prisma.user.count({ where: { state: code } })

  // ── Top bills voted on by users in this state ──────────────────────────────
  const stateVotes = await prisma.vote.groupBy({
    by: ['billId'],
    where: { user: { state: code } },
    _count: { billId: true },
    orderBy: { _count: { billId: 'desc' } },
    take: 8,
  })
  const topBillIds = stateVotes.map(v => v.billId)
  const billsRaw = topBillIds.length > 0
    ? await prisma.bill.findMany({
        where: { id: { in: topBillIds } },
        select: {
          id: true, title: true, shortTitle: true, billType: true,
          billNumber: true, status: true, policyArea: true,
        },
      })
    : []
  const billMap = new Map(billsRaw.map(b => [b.id, b]))

  // For each top bill, compute the state's yes/no/total breakdown
  const billBreakdownsRaw = topBillIds.length > 0
    ? await prisma.vote.findMany({
        where: { billId: { in: topBillIds }, user: { state: code } },
        select: { billId: true, position: true },
      })
    : []
  const breakdowns = new Map<string, { yes: number; no: number; abstain: number; total: number }>()
  for (const v of billBreakdownsRaw) {
    const b = breakdowns.get(v.billId) ?? { yes: 0, no: 0, abstain: 0, total: 0 }
    if (v.position === 'yes') b.yes++
    else if (v.position === 'no') b.no++
    else b.abstain++
    b.total++
    breakdowns.set(v.billId, b)
  }
  const topBills = stateVotes
    .map(v => {
      const bill = billMap.get(v.billId)
      if (!bill) return null
      return { ...bill, voteCount: v._count.billId, breakdown: breakdowns.get(v.billId) ?? null }
    })
    .filter(Boolean)

  // ── Policy area breakdown — all bills users in this state have voted on ───
  // Powers the pie chart. Goes wider than topBills (which is limited to 8).
  const policyAreaVotes = await prisma.vote.findMany({
    where: { user: { state: code } },
    select: { bill: { select: { policyArea: true } } },
    take: 1000, // generous cap — typical state has way less than this in flight
  })
  const policyAreaCounts: Record<string, number> = {}
  for (const v of policyAreaVotes) {
    const area = v.bill?.policyArea || 'Uncategorized'
    policyAreaCounts[area] = (policyAreaCounts[area] || 0) + 1
  }
  const policyAreas = Object.entries(policyAreaCounts)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)

  // ── Recent discussions from users in this state ────────────────────────────
  const discussions = await prisma.discussion.findMany({
    where: { user: { state: code }, parentId: null },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true } },
      bill: { select: { id: true, billType: true, billNumber: true, shortTitle: true, title: true } },
      _count: { select: { replies: true } },
    },
  })

  // ── State's representatives ────────────────────────────────────────────────
  // Representative.state is stored as the full name ('California'), so we
  // expand the URL's 2-letter code first.
  const reps = await prisma.representative.findMany({
    where: { state: abbrToName(code) ?? code },
    orderBy: [{ chamber: 'asc' }, { lastName: 'asc' }],
    select: {
      bioguideId: true, fullName: true, firstName: true, lastName: true,
      party: true, chamber: true, district: true, state: true,
    },
  })

  // ── Recent roll-call votes by this state's reps ────────────────────────────
  const repBioguides = reps.map(r => r.bioguideId)
  const recentRepVotes = repBioguides.length > 0
    ? await prisma.congressVote.findMany({
        where: { bioguideId: { in: repBioguides } },
        orderBy: { votedAt: 'desc' },
        take: 10,
        select: { bioguideId: true, billId: true, position: true, votedAt: true, chamber: true },
      })
    : []
  const repVoteBillIds = Array.from(new Set(recentRepVotes.map(v => v.billId)))
  const repVoteBills = repVoteBillIds.length > 0
    ? await prisma.bill.findMany({
        where: { id: { in: repVoteBillIds } },
        select: { id: true, billType: true, billNumber: true, shortTitle: true, title: true, status: true },
      })
    : []
  const repBillMap = new Map(repVoteBills.map(b => [b.id, b]))
  const repMap = new Map(reps.map(r => [r.bioguideId, r]))
  const repActivity = recentRepVotes
    .map(v => ({
      rep: repMap.get(v.bioguideId),
      bill: repBillMap.get(v.billId),
      position: v.position,
      votedAt: v.votedAt,
      chamber: v.chamber,
    }))
    .filter(item => item.rep && item.bill)

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const totalVotes = await prisma.vote.count({ where: { user: { state: code } } })
  const totalDiscussions = await prisma.discussion.count({ where: { user: { state: code } } })

  return NextResponse.json({
    code,
    stats: { citizenCount, totalVotes, totalDiscussions },
    topBills,
    policyAreas,
    discussions,
    reps,
    repActivity,
  })
}

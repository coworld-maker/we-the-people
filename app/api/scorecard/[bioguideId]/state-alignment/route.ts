import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

interface BillAlignment {
  billId: string
  billType: string
  billNumber: string
  billTitle: string
  memberPosition: string
  stateBreakdown: { yes: number; no: number; abstain: number; total: number }
  stateMajority: 'yes' | 'no' | 'tied'
  aligned: boolean | null   // null when state had no recorded preference
}

/**
 * Compare a member's roll-call votes against the prevailing sentiment of
 * citizens in their own state on this platform.
 *
 * For each bill where (a) the rep cast yea/nay and (b) at least one
 * citizen in the rep's state voted yes/no, we check whether the rep's
 * position matched the state's majority position. Abstentions on both
 * sides are excluded from the alignment calculation.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bioguideId } = await params

  const rep = await prisma.representative.findUnique({
    where: { bioguideId },
    select: { state: true, fullName: true },
  })
  if (!rep) return NextResponse.json({ error: 'Representative not found' }, { status: 404 })

  // Pull the rep's roll-call votes (yea/nay only)
  const memberVotes = await prisma.congressVote.findMany({
    where: { bioguideId, position: { in: ['yea', 'nay'] } },
    orderBy: { votedAt: 'desc' },
    take: 200,
    select: { billId: true, position: true },
  })

  if (memberVotes.length === 0) {
    return NextResponse.json({
      stateCode: rep.state,
      alignmentPct: null,
      matchedBills: 0,
      totalBills: 0,
      details: [],
    })
  }

  const billIds = Array.from(new Set(memberVotes.map(v => v.billId)))

  // Citizen votes from rep's state on those same bills
  const citizenVotes = await prisma.vote.findMany({
    where: {
      billId: { in: billIds },
      user: { state: rep.state },
    },
    select: { billId: true, position: true },
  })

  // Group citizen votes by bill
  const stateMap = new Map<string, { yes: number; no: number; abstain: number; total: number }>()
  for (const v of citizenVotes) {
    const entry = stateMap.get(v.billId) ?? { yes: 0, no: 0, abstain: 0, total: 0 }
    if (v.position === 'yes') entry.yes++
    else if (v.position === 'no') entry.no++
    else entry.abstain++
    entry.total++
    stateMap.set(v.billId, entry)
  }

  // Bill metadata for the details list
  const bills = await prisma.bill.findMany({
    where: { id: { in: billIds } },
    select: { id: true, billType: true, billNumber: true, title: true, shortTitle: true },
  })
  const billMap = new Map(bills.map(b => [b.id, b]))

  const details: BillAlignment[] = []
  let matched = 0, total = 0

  for (const mv of memberVotes) {
    const bill = billMap.get(mv.billId)
    const breakdown = stateMap.get(mv.billId)
    if (!bill || !breakdown) continue

    // Only count bills where the state had a clear yes/no preference
    if (breakdown.yes === 0 && breakdown.no === 0) continue

    let majority: 'yes' | 'no' | 'tied'
    if (breakdown.yes > breakdown.no) majority = 'yes'
    else if (breakdown.no > breakdown.yes) majority = 'no'
    else majority = 'tied'

    let aligned: boolean | null = null
    if (majority !== 'tied') {
      // Normalize: yea ↔ yes, nay ↔ no
      const memberYes = mv.position === 'yea'
      aligned = memberYes ? majority === 'yes' : majority === 'no'
      total++
      if (aligned) matched++
    }

    details.push({
      billId: bill.id,
      billType: bill.billType,
      billNumber: bill.billNumber,
      billTitle: bill.shortTitle || bill.title,
      memberPosition: mv.position,
      stateBreakdown: breakdown,
      stateMajority: majority,
      aligned,
    })
  }

  return NextResponse.json({
    stateCode: rep.state,
    alignmentPct: total > 0 ? Math.round((matched / total) * 100) : null,
    matchedBills: matched,
    totalBills: total,
    details: details.slice(0, 20),
  })
}

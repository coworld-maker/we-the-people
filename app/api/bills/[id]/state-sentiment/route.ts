import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

interface StateBreakdown {
  yes: number
  no: number
  abstain: number
  total: number
}

/**
 * Aggregate citizen votes on a bill, grouped by the voter's home state.
 * Returns { byState: { CA: {yes, no, abstain, total}, ... }, totalVotes, statesWithVotes }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Pull all votes on this bill that have a state attached via the user
  const votes = await prisma.vote.findMany({
    where: { billId: id, user: { state: { not: null } } },
    select: { position: true, user: { select: { state: true } } },
  })

  const byState: Record<string, StateBreakdown> = {}
  for (const v of votes) {
    const code = v.user?.state
    if (!code) continue
    const entry = byState[code] ?? { yes: 0, no: 0, abstain: 0, total: 0 }
    if (v.position === 'yes') entry.yes++
    else if (v.position === 'no') entry.no++
    else entry.abstain++
    entry.total++
    byState[code] = entry
  }

  return NextResponse.json({
    byState,
    totalVotes: votes.length,
    statesWithVotes: Object.keys(byState).length,
  })
}

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserService } from '@/lib/services/userService'

import { ABBR_TO_NAME as ABBR_TO_STATE } from '@/lib/utils/state-codes'

function normalizeRepPosition(pos: string): 'yea' | 'nay' | 'present' | 'not_voting' {
  const p = pos.toLowerCase()
  if (p === 'yea' || p === 'aye' || p === 'yes') return 'yea'
  if (p === 'nay' || p === 'no') return 'nay'
  if (p === 'present') return 'present'
  return 'not_voting'
}

function isMatch(userPosition: string, repPosition: string): boolean {
  const rep = normalizeRepPosition(repPosition)
  return (userPosition === 'yes' && rep === 'yea') || (userPosition === 'no' && rep === 'nay')
}

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const stateAbbr = request.nextUrl.searchParams.get('state')?.toUpperCase()
  if (!stateAbbr) return NextResponse.json({ error: 'state is required' }, { status: 400 })

  const fullStateName = ABBR_TO_STATE[stateAbbr]
  if (!fullStateName) return NextResponse.json({ error: 'Invalid state' }, { status: 400 })

  // Get user's votes with bill info
  const userVotes = await prisma.vote.findMany({
    where: { userId: user.id },
    include: {
      bill: {
        select: { id: true, title: true, shortTitle: true, billType: true, billNumber: true },
      },
    },
  })

  if (userVotes.length === 0) {
    return NextResponse.json({ reps: [], userVoteCount: 0 })
  }

  const votedBillIds = userVotes.map(v => v.billId)
  const userVoteMap = new Map(userVotes.map(v => [v.billId, v]))

  // Get reps for this state from our DB
  const reps = await prisma.representative.findMany({
    where: { state: fullStateName, currentTerm: true },
    orderBy: [{ chamber: 'desc' }, { lastName: 'asc' }],
  })

  if (reps.length === 0) {
    return NextResponse.json({ reps: [], userVoteCount: userVotes.length })
  }

  const repBioguideIds = reps.map(r => r.bioguideId)

  // Fetch CongressVotes for these reps on bills the user voted on — no relations, join in memory
  const congressVotes = await prisma.congressVote.findMany({
    where: {
      bioguideId: { in: repBioguideIds },
      billId: { in: votedBillIds },
    },
  })

  // Group congress votes by bioguideId
  const cvByRep = new Map<string, typeof congressVotes>()
  for (const cv of congressVotes) {
    const existing = cvByRep.get(cv.bioguideId) ?? []
    existing.push(cv)
    cvByRep.set(cv.bioguideId, existing)
  }

  // Build result per rep
  const result = reps.map(rep => {
    const repVotes = cvByRep.get(rep.bioguideId) ?? []

    const comparisons = repVotes.map(cv => {
      const uv = userVoteMap.get(cv.billId)!
      return {
        billId: cv.billId,
        billType: uv.bill.billType,
        billNumber: uv.bill.billNumber,
        billTitle: uv.bill.shortTitle || uv.bill.title,
        userPosition: uv.position,
        repPosition: cv.position,
        match: isMatch(uv.position, cv.position),
        votedAt: cv.votedAt?.toISOString() ?? null,
      }
    })

    const overlappingVotes = comparisons.length
    const matches = comparisons.filter(c => c.match).length
    const alignment = overlappingVotes > 0 ? Math.round((matches / overlappingVotes) * 100) : null

    return {
      bioguideId: rep.bioguideId,
      name: rep.fullName,
      party: rep.party,
      chamber: rep.chamber,
      district: rep.district ?? null,
      alignment,
      overlappingVotes,
      comparisons: comparisons.sort((a, b) => (b.votedAt ?? '').localeCompare(a.votedAt ?? '')),
    }
  })

  return NextResponse.json({ reps: result, userVoteCount: userVotes.length })
}

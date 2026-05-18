import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Infer policy interests from the user's voting history.
 * Returns the top N policy areas (by vote count) the user has cast votes on,
 * along with the total number of votes considered.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Pull recent votes with bill policy areas
  const votes = await prisma.vote.findMany({
    where: { userId: user.id },
    select: { bill: { select: { policyArea: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Count by policy area
  const counts = new Map<string, number>()
  for (const v of votes) {
    const area = v.bill?.policyArea
    if (!area) continue
    counts.set(area, (counts.get(area) ?? 0) + 1)
  }

  const topAreas = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area, count]) => ({ area, count }))

  return NextResponse.json({
    totalVotes: votes.length,
    topAreas,
  })
}

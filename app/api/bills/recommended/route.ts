import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = req.nextUrl.searchParams.get('areas') ?? ''
  const areas = raw.split(',').map(s => s.trim()).filter(Boolean)
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '6'), 20)

  if (areas.length === 0) return NextResponse.json({ bills: [] })

  const bills = await prisma.bill.findMany({
    where: { policyArea: { in: areas } },
    orderBy: [{ latestActionDate: 'desc' }],
    take: limit,
    select: {
      id: true, title: true, shortTitle: true,
      billType: true, billNumber: true, status: true, policyArea: true,
      introducedDate: true,
      _count: { select: { votes: true, discussions: true } },
    },
  })

  return NextResponse.json({ bills })
}

/**
 * GET /api/search?q=...
 *
 * Global search backing the Cmd+K command palette. Searches three indexes:
 *   bills  — title/shortTitle text match, plus bill-number patterns ("HR 2847",
 *            "hr2847", "s 142") matched directly on billType + billNumber
 *   reps   — current members by full name or state abbreviation
 *   topics — distinct policy areas, linking into the filtered bill feed
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const BILL_TYPES = ['HR', 'S', 'HRES', 'SRES', 'HJRES', 'SJRES', 'HCONRES', 'SCONRES']

/** Parse "hr 2847", "HR2847", "h.r. 2847" → { billType: 'HR', billNumber: '2847' } */
function parseBillNumber(q: string): { billType: string; billNumber: string } | null {
  const compact = q.toUpperCase().replace(/[.\s-]/g, '')
  const m = compact.match(/^([A-Z]+)(\d+)$/)
  if (!m) return null
  return BILL_TYPES.includes(m[1]) ? { billType: m[1], billNumber: m[2] } : null
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ bills: [], reps: [], topics: [] })
  }

  const billNo = parseBillNumber(q)

  const [bills, reps, topicGroups] = await Promise.all([
    prisma.bill.findMany({
      where: billNo
        ? { billType: billNo.billType, billNumber: { startsWith: billNo.billNumber } }
        : {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { shortTitle: { contains: q, mode: 'insensitive' } },
            ],
          },
      orderBy: { latestActionDate: 'desc' },
      take: 6,
      select: {
        id: true, billType: true, billNumber: true,
        title: true, shortTitle: true, status: true, policyArea: true,
      },
    }),
    prisma.representative.findMany({
      where: {
        currentTerm: true,
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { lastName: 'asc' },
      take: 5,
      select: {
        bioguideId: true, fullName: true, party: true,
        state: true, district: true, chamber: true,
      },
    }),
    prisma.bill.groupBy({
      by: ['policyArea'],
      where: { policyArea: { contains: q, mode: 'insensitive' } },
      _count: { policyArea: true },
      orderBy: { _count: { policyArea: 'desc' } },
      take: 4,
    }),
  ])

  return NextResponse.json({
    bills: bills.map(b => ({
      id: b.id,
      label: b.shortTitle || b.title,
      code: `${b.billType} ${b.billNumber}`,
      status: b.status,
      policyArea: b.policyArea,
      href: `/bills/${b.id}`,
    })),
    reps: reps.map(r => ({
      label: r.fullName,
      detail: `${r.chamber} · ${r.state}${r.district ? `-${r.district}` : ''} (${r.party})`,
      href: `/scorecards/${r.bioguideId}`,
    })),
    topics: topicGroups
      .filter(t => t.policyArea)
      .map(t => ({
        label: t.policyArea as string,
        detail: `${t._count.policyArea} bills`,
        href: `/bills?policyArea=${encodeURIComponent(t.policyArea as string)}`,
      })),
  })
}

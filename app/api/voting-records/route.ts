// app/api/voting-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chamber = searchParams.get('chamber') || 'Senate';
  const party = searchParams.get('party') || '';
  const state = searchParams.get('state') || '';
  const position = searchParams.get('position') || '';
  const billId = searchParams.get('billId') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const offset = (page - 1) * limit;

  // Build representative filter
  const repWhere: any = { chamber };
  if (party) repWhere.party = party;
  if (state) repWhere.state = state;

  // Build vote filter
  const voteWhere: any = {
    representative: repWhere,
  };
  if (position) voteWhere.position = position;
  if (billId) voteWhere.billId = billId;

  const [votes, total] = await Promise.all([
    prisma.congressVote.findMany({
      where: voteWhere,
      include: {
        representative: {
          select: {
            bioguideId: true,
            fullName: true,
            firstName: true,
            lastName: true,
            party: true,
            state: true,
            imageUrl: true,
          },
        },
        bill: {
          select: {
            id: true,
            title: true,
            billType: true,
            billNumber: true,
            congress: true,
          },
        },
      },
      orderBy: { votedAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.congressVote.count({ where: voteWhere }),
  ]);

  // Also return distinct bills and states for filter dropdowns
  const [bills, states] = await Promise.all([
    prisma.bill.findMany({
      where: {
        congressVotes: { some: {} },
      },
      select: { id: true, title: true, billType: true, billNumber: true, congress: true },
      orderBy: { billNumber: 'asc' },
    }),
    prisma.representative.findMany({
      where: { chamber },
      select: { state: true },
      distinct: ['state'],
      orderBy: { state: 'asc' },
    }),
  ]);

  return NextResponse.json({
    votes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    filterOptions: {
      bills,
      states: states.map(s => s.state),
    },
  });
}

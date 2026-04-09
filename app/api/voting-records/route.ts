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

  // Step 1: Get senators matching filters
  const repWhere: any = { chamber };
  if (party) repWhere.party = party;
  if (state) repWhere.state = state;

  const senators = await prisma.representative.findMany({
    where: repWhere,
    select: {
      bioguideId: true,
      fullName: true,
      firstName: true,
      lastName: true,
      party: true,
      state: true,
      imageUrl: true,
    },
  });

  const bioguideIds = senators.map(s => s.bioguideId);
  if (bioguideIds.length === 0) {
    return NextResponse.json({ votes: [], total: 0, page, limit, totalPages: 0, filterOptions: { bills: [], states: [] } });
  }

  // Build senator lookup map
  const senatorMap = new Map(senators.map(s => [s.bioguideId, s]));

  // Step 2: Get votes for those senators
  const voteWhere: any = { bioguideId: { in: bioguideIds } };
  if (position) voteWhere.position = position;
  if (billId) voteWhere.billId = billId;

  const [rawVotes, total] = await Promise.all([
    prisma.congressVote.findMany({
      where: voteWhere,
      select: {
        id: true,
        bioguideId: true,
        billId: true,
        position: true,
        chamber: true,
        rollNumber: true,
        votedAt: true,
      },
      orderBy: { votedAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.congressVote.count({ where: voteWhere }),
  ]);

  // Step 3: Get bills for those votes
  const billIds = [...new Set(rawVotes.map(v => v.billId).filter(Boolean))] as string[];
  const bills = billIds.length > 0
    ? await prisma.bill.findMany({
        where: { id: { in: billIds } },
        select: { id: true, title: true, billType: true, billNumber: true, congress: true },
      })
    : [];
  const billMap = new Map(bills.map(b => [b.id, b]));

  // Step 4: Join in memory
  const votes = rawVotes.map(v => ({
    id: v.id,
    position: v.position,
    chamber: v.chamber,
    rollNumber: v.rollNumber,
    votedAt: v.votedAt,
    representative: senatorMap.get(v.bioguideId) ?? null,
    bill: v.billId ? billMap.get(v.billId) ?? null : null,
  })).filter(v => v.representative && v.bill);

  // Step 5: Filter options
  const [allBillsWithVotes, allStates] = await Promise.all([
    prisma.bill.findMany({
      where: { id: { in: await prisma.congressVote.findMany({ select: { billId: true }, distinct: ['billId'] }).then(rows => rows.map(r => r.billId!).filter(Boolean)) } },
      select: { id: true, title: true, billType: true, billNumber: true, congress: true },
      orderBy: { billType: 'asc' },
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
      bills: allBillsWithVotes,
      states: allStates.map(s => s.state),
    },
  });
}

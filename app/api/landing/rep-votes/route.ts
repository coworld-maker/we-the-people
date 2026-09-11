// Public: each shown rep's 3 most recent votes ON bills (passage roll calls
// only), for the landing hero. Returns public roll-call facts only.
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ON_THE_BILL } from '@/lib/data/voteKinds'
import { parseIds, pickLatestVotes, type VoteRow } from '@/lib/data/repVotes'

// Enough history per member to still have 3 distinct bills after dropping
// repeat passage roll calls on the same bill.
const ROWS_PER_MEMBER = 30

export async function GET(req: Request) {
  const ids = parseIds(new URL(req.url).searchParams.get('ids'))
  if (!ids) {
    return NextResponse.json({ error: 'Pass 1–6 bioguide ids, e.g. ids=A000001,B000002.' }, { status: 400 })
  }

  try {
    const perMember = await Promise.all(ids.map(bioguideId =>
      prisma.congressVote.findMany({
        where: { bioguideId, ...ON_THE_BILL },
        orderBy: { votedAt: { sort: 'desc', nulls: 'last' } },
        take: ROWS_PER_MEMBER,
        select: {
          bioguideId: true, billId: true, position: true, votedAt: true, chamber: true,
          rollNumber: true, congress: true, session: true, question: true,
          bill: { select: { billType: true, billNumber: true, title: true, shortTitle: true } },
        },
      })))
    const votes = pickLatestVotes(ids, perMember.flat() as VoteRow[])
    return NextResponse.json({ votes }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error('[rep-votes]', err)
    return NextResponse.json({ error: "Couldn't load votes right now." }, { status: 500 })
  }
}

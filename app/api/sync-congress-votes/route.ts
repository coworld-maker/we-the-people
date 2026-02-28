// app/api/sync-congress-votes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllMemberVotesForBill } from '@/lib/congress-votes'
import { randomUUID } from 'crypto'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-sync-secret')
  return secret === process.env.CRON_SECRET
}

async function syncBill(bill: { id: string; congress: string; billType: string; billNumber: string }) {
  const results = await fetchAllMemberVotesForBill(
    bill.congress,
    bill.billType,
    bill.billNumber
  )

  if (!results.length) {
    return { billId: bill.id, synced: 0, skipped: true, reason: 'no_roll_calls' }
  }

  const { ref, members } = results[0]
  let synced = 0

  for (const member of members) {
    try {
      await prisma.$executeRaw`
        INSERT INTO public."CongressVote"
          ("id", "bioguideId", "billId", "position", "chamber", "rollNumber", "congress", "session", "votedAt", "createdAt", "updatedAt")
        VALUES (
          ${`cv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`},
          ${member.bioguideId},
          ${bill.id},
          ${member.position},
          ${ref.chamber},
          ${ref.rollNumber},
          ${ref.congress},
          ${ref.session},
          ${ref.date ? new Date(ref.date) : null},
          NOW(),
          NOW()
        )
        ON CONFLICT ("bioguideId", "billId")
        DO UPDATE SET
          "position" = EXCLUDED."position",
          "rollNumber" = EXCLUDED."rollNumber",
          "updatedAt" = NOW()
      `
      synced++
    } catch (err) {
      console.error(`Failed to upsert vote for ${member.bioguideId} on ${bill.id}:`, err)
    }
  }

  return { billId: bill.id, synced, chamber: ref.chamber, rollNumber: ref.rollNumber }
}

// POST /api/sync-congress-votes
// Body: { "billId": "cmlq6d9z6000104l5517420nv" }  ← single bill (DB cuid)
//       { "congress": "119" }                        ← all bills from a congress
//       { "syncAll": true }                          ← all bills (batched, slow)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { billId, syncAll, congress: congressFilter } = body

  // --- Single bill ---
  if (billId) {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      select: { id: true, congress: true, billType: true, billNumber: true },
    })
    if (!bill) {
      return NextResponse.json({ error: `Bill not found: ${billId}` }, { status: 404 })
    }
    try {
      const result = await syncBill(bill)
      return NextResponse.json({ success: true, result })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // --- Batch sync ---
  if (syncAll || congressFilter) {
    const where = congressFilter ? { congress: String(congressFilter) } : {}
    const bills = await prisma.bill.findMany({
      where,
      select: { id: true, congress: true, billType: true, billNumber: true },
      take: 100,
    })

    const results = []
    let totalSynced = 0

    for (const bill of bills) {
      try {
        const result = await syncBill(bill)
        results.push(result)
        totalSynced += result.synced ?? 0
        await new Promise(r => setTimeout(r, 300)) // stay under 5000 req/hr rate limit
      } catch (err: any) {
        results.push({ billId: bill.id, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      billsProcessed: bills.length,
      totalVotesSynced: totalSynced,
      results,
    })
  }

  return NextResponse.json(
    { error: 'Provide billId (DB cuid), congress: "119", or syncAll: true' },
    { status: 400 }
  )
}

// GET /api/sync-congress-votes?billId=<cuid>  ← check sync status
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const billId = req.nextUrl.searchParams.get('billId')
  if (!billId) {
    return NextResponse.json({ error: 'billId required' }, { status: 400 })
  }

  const count = await prisma.congressVote.count({ where: { billId } })
  const sample = await prisma.congressVote.findMany({
    where: { billId },
    take: 5,
    select: { bioguideId: true, position: true, chamber: true, votedAt: true },
  })

  return NextResponse.json({ billId, totalVotes: count, sample })
}

// app/api/sync-congress-votes/route.ts
// Syncs how Congress members voted on bills into the CongressVote table.
//
// Usage:
//   POST /api/sync-congress-votes
//   Body (JSON):
//     { "billId": "119-hr-1234" }           ← sync one bill
//     { "syncAll": true }                    ← sync all bills in DB (slow, use sparingly)
//     { "congress": "119" }                  ← sync all bills from a given congress
//
// Protected: requires SYNC_SECRET header to match CRON_SECRET env var
// Can also be triggered by a Vercel cron job.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  fetchAllMemberVotesForBill,
  getBillRollCallRefs,
  getHouseMemberVotes,
  getSenateMemberVotes,
  type MemberVote,
  type RollCallVoteRef,
} from '@/lib/congress-votes'
import { randomUUID } from 'crypto'

// -----------------------------------------------------------------------
// Auth guard — protect against unauthorized syncs
// -----------------------------------------------------------------------
function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-sync-secret')
  return secret === process.env.CRON_SECRET
}

// -----------------------------------------------------------------------
// Parse billId → { congress, billType, billNumber }
// billId format in DB: "{congress}-{billType}-{billNumber}"
// e.g. "119-hr-1234" or "118-s-500"
// -----------------------------------------------------------------------
function parseBillId(billId: string): { congress: string; billType: string; billNumber: string } | null {
  const parts = billId.split('-')
  if (parts.length < 3) return null
  const [congress, billType, ...rest] = parts
  return { congress, billType, billNumber: rest.join('-') }
}

// -----------------------------------------------------------------------
// Core sync function for a single bill
// -----------------------------------------------------------------------
async function syncBill(bill: { id: string; congress: string; billType: string; billNumber: string }) {
  const { id: billId, congress, billType, billNumber } = bill
  const results = await fetchAllMemberVotesForBill(congress, billType, billNumber)

  if (!results.length) {
    return { billId, synced: 0, skipped: true, reason: 'no_roll_calls' }
  }

  const { ref, members } = results[0]
  let synced = 0

  for (const member of members) {
    try {
      await prisma.$executeRaw`
        INSERT INTO public."CongressVote" 
          ("id", "bioguideId", "billId", "position", "chamber", "rollNumber", "congress", "session", "votedAt", "createdAt", "updatedAt")
        VALUES (
          ${randomUUID()},
          ${member.bioguideId},
          ${billId},
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
      console.error(`Failed to upsert vote for ${member.bioguideId} on ${billId}:`, err)
    }
  }

  return { billId, synced, chamber: ref.chamber, rollNumber: ref.rollNumber }
}

// -----------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { billId, syncAll, congress: congressFilter } = body

  // --- Single bill sync ---
  if (billId) {
    const parsed = parseBillId(billId)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid billId format. Expected: {congress}-{billType}-{billNumber}' }, { status: 400 })
    }

    try {
      const result = await syncBill({ id: billId, ...parsed })
      return NextResponse.json({ success: true, result })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // --- Sync all bills (or by congress) ---
  if (syncAll || congressFilter) {
    const where = congressFilter ? { congress: String(congressFilter) } : {}

    const bills = await prisma.bill.findMany({
      where,
      select: { id: true, congress: true, billType: true, billNumber: true },
      take: 100, // safety limit — run in batches
    })

    const results = []
    let totalSynced = 0

    for (const bill of bills) {
      try {
        const result = await syncBill(bill)
        results.push(result)
        totalSynced += result.synced ?? 0
        // Rate limit: Congress.gov allows 5000 req/hr
        await new Promise(r => setTimeout(r, 300))
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
    { error: 'Provide billId, syncAll: true, or congress: "119"' },
    { status: 400 }
  )
}

// -----------------------------------------------------------------------
// GET handler — check sync status for a bill
// GET /api/sync-congress-votes?billId=119-hr-1234
// -----------------------------------------------------------------------
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

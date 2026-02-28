// app/api/cron/sync/route.ts
// Called by GitHub Actions daily cron job
// Syncs 119th Congress bills then syncs member votes

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllMemberVotesForBill } from '@/lib/congress-votes'
import { randomUUID } from 'crypto'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'
const API_KEY = process.env.CONGRESS_API_KEY

function isAuthorized(req: NextRequest): boolean {
  // GitHub Actions sends: Authorization: Bearer <secret>
  const auth = req.headers.get('authorization')
  const bearer = auth?.replace('Bearer ', '').trim()
  // Also support x-sync-secret for manual calls
  const header = req.headers.get('x-sync-secret')
  return bearer === process.env.CRON_SECRET || header === process.env.CRON_SECRET
}

async function syncBills() {
  const url = `${CONGRESS_API_BASE}/bill/119?limit=50&sort=updateDate+desc&api_key=${API_KEY}&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Congress API error: ${res.status}`)
  const data = await res.json()
  const bills = data.bills ?? []

  let created = 0, updated = 0, failed = 0

  for (const bill of bills) {
    try {
      const billType = (bill.type ?? 'HR').toUpperCase()
      const billNumber = String(bill.number ?? '')
      const billCongress = String(bill.congress ?? 119)
      if (!billNumber) continue

      const data = {
        congress: billCongress,
        billType,
        billNumber,
        title: bill.title ?? 'Untitled',
        shortTitle: null,
        summary: null,
        introducedDate: bill.introducedDate ? new Date(bill.introducedDate) : new Date(),
        latestActionDate: bill.latestAction?.actionDate ? new Date(bill.latestAction.actionDate) : null,
        latestActionText: bill.latestAction?.text ?? null,
        status: 'introduced',
        originChamber: bill.originChamber ?? 'House',
        policyArea: bill.policyArea?.name ?? null,
        subjects: [],
        sponsors: [],
        cosponsors: null,
        actions: null,
      }

      const existing = await prisma.bill.findUnique({
        where: { congress_billType_billNumber: { congress: billCongress, billType, billNumber } },
        select: { id: true },
      })

      if (existing) {
        await prisma.bill.update({ where: { id: existing.id }, data })
        updated++
      } else {
        await prisma.bill.create({ data })
        created++
      }

      await new Promise(r => setTimeout(r, 150))
    } catch {
      failed++
    }
  }

  return { billsFetched: bills.length, created, updated, failed }
}

async function syncVotes() {
  const bills = await prisma.bill.findMany({
    where: { congress: '119' },
    select: { id: true, congress: true, billType: true, billNumber: true },
    take: 100,
  })

  let totalSynced = 0

  for (const bill of bills) {
    try {
      const results = await fetchAllMemberVotesForBill(bill.congress, bill.billType, bill.billNumber)
      if (!results.length) continue

      const { ref, members } = results[0]
      for (const member of members) {
        await prisma.$executeRaw`
          INSERT INTO public."CongressVote"
            ("id", "bioguideId", "billId", "position", "chamber", "rollNumber", "congress", "session", "votedAt", "createdAt", "updatedAt")
          VALUES (
            ${randomUUID()}, ${member.bioguideId}, ${bill.id}, ${member.position},
            ${ref.chamber}, ${ref.rollNumber}, ${ref.congress}, ${ref.session},
            ${ref.date ? new Date(ref.date) : null}, NOW(), NOW()
          )
          ON CONFLICT ("bioguideId", "billId")
          DO UPDATE SET "position" = EXCLUDED."position", "updatedAt" = NOW()
        `
        totalSynced++
      }
      await new Promise(r => setTimeout(r, 300))
    } catch {
      // continue
    }
  }

  return { totalSynced }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const billResults = await syncBills()
    const voteResults = await syncVotes()
    return NextResponse.json({ success: true, bills: billResults, votes: voteResults })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

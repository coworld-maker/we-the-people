// app/api/sync-bills/route.ts
// Fetches bills from Congress.gov and saves them to the database.
//
// POST /api/sync-bills
// Body:
//   { "congress": 119, "limit": 50 }              ← fetch recent bills
//   { "congress": 119, "policyArea": "Health" }    ← fetch by policy area
//   { "congress": 119, "limit": 250, "offset": 0 } ← paginated full sync
//
// Protected by CRON_SECRET header

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'
const API_KEY = process.env.CONGRESS_API_KEY

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-sync-secret')
  return secret === process.env.CRON_SECRET
}

async function fetchBills(congress: number, limit: number, offset: number, policyArea?: string) {
  let url = `${CONGRESS_API_BASE}/bill/${congress}?limit=${limit}&offset=${offset}&sort=updateDate+desc&api_key=${API_KEY}&format=json`
  if (policyArea) url += `&policyArea=${encodeURIComponent(policyArea)}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Congress API error: ${res.status}`)
  const data = await res.json()
  return data.bills ?? []
}

async function fetchBillDetails(congress: number, billType: string, billNumber: string) {
  const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType.toLowerCase()}/${billNumber}?api_key=${API_KEY}&format=json`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.bill ?? null
}

function normalizeStatus(bill: any): string {
  const actions = bill.latestAction?.text?.toLowerCase() ?? ''
  if (bill.laws?.length > 0) return 'enacted'
  if (actions.includes('became public law') || actions.includes('signed by president')) return 'enacted'
  if (actions.includes('passed senate') && actions.includes('passed house')) return 'passed_both'
  if (actions.includes('passed senate')) return 'passed_chamber'
  if (actions.includes('passed house')) return 'passed_chamber'
  if (actions.includes('referred to')) return 'in_committee'
  if (actions.includes('reported')) return 'reported'
  return 'introduced'
}

function buildSponsors(bill: any): any {
  if (!bill.sponsors?.length) return []
  return bill.sponsors.map((s: any) => ({
    bioguideId: s.bioguideId,
    firstName: s.firstName,
    lastName: s.lastName,
    party: s.party,
    state: s.state,
    district: s.district,
  }))
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'CONGRESS_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const congress = body.congress ?? 119
  const limit = Math.min(body.limit ?? 50, 250)
  const offset = body.offset ?? 0
  const policyArea = body.policyArea ?? undefined

  let bills: any[]
  try {
    bills = await fetchBills(congress, limit, offset, policyArea)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  let created = 0
  let updated = 0
  let failed = 0

  for (const bill of bills) {
    try {
      const billType = bill.type ?? bill.billType
      const billNumber = String(bill.number ?? bill.billNumber)
      const billCongress = String(bill.congress ?? congress)

      // Fetch full details for richer data
      const details = await fetchBillDetails(Number(billCongress), billType, billNumber)
      const source = details ?? bill

      const data = {
        congress: billCongress,
        billType: billType.toUpperCase(),
        billNumber,
        title: source.title ?? bill.title ?? 'Untitled',
        shortTitle: source.shortTitle ?? null,
        summary: source.summaries?.[0]?.text ?? null,
        introducedDate: new Date(source.introducedDate ?? bill.introducedDate),
        latestActionDate: source.latestAction?.actionDate
          ? new Date(source.latestAction.actionDate)
          : null,
        latestActionText: source.latestAction?.text ?? null,
        status: normalizeStatus(source),
        originChamber: source.originChamber ?? bill.originChamber ?? 'House',
        policyArea: source.policyArea?.name ?? bill.policyArea?.name ?? null,
        subjects: source.subjects?.map((s: any) => s.name ?? s) ?? [],
        sponsors: buildSponsors(source),
        cosponsors: source.cosponsors ?? null,
        actions: source.actions ?? null,
      }

      const existing = await prisma.bill.findUnique({
        where: {
          congress_billType_billNumber: {
            congress: data.congress,
            billType: data.billType,
            billNumber: data.billNumber,
          },
        },
      })

      if (existing) {
        await prisma.bill.update({ where: { id: existing.id }, data })
        updated++
      } else {
        await prisma.bill.create({ data })
        created++
      }

      // Stay under rate limit
      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      console.error('Failed to save bill:', err)
      failed++
    }
  }

  return NextResponse.json({
    success: true,
    congress,
    billsFetched: bills.length,
    created,
    updated,
    failed,
  })
}

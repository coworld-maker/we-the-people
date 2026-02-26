// app/api/sync-bills/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'
const API_KEY = process.env.CONGRESS_API_KEY

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-sync-secret') === process.env.CRON_SECRET
}

async function fetchBills(congress: number, limit: number, offset: number, policyArea?: string) {
  let url = `${CONGRESS_API_BASE}/bill/${congress}?limit=${limit}&offset=${offset}&sort=updateDate+desc&api_key=${API_KEY}&format=json`
  if (policyArea) url += `&policyArea=${encodeURIComponent(policyArea)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Congress API error: ${res.status} - ${await res.text()}`)
  const data = await res.json()
  return data.bills ?? []
}

async function fetchBillDetails(congress: number, billType: string, billNumber: string) {
  try {
    const url = `${CONGRESS_API_BASE}/bill/${congress}/${billType.toLowerCase()}/${billNumber}?api_key=${API_KEY}&format=json`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.bill ?? null
  } catch {
    return null
  }
}

function normalizeStatus(latestActionText: string, laws: any[]): string {
  const text = latestActionText?.toLowerCase() ?? ''
  if (laws?.length > 0) return 'enacted'
  if (text.includes('became public law') || text.includes('signed by president')) return 'enacted'
  if (text.includes('passed senate') && text.includes('passed house')) return 'passed_both'
  if (text.includes('passed senate') || text.includes('passed house')) return 'passed_chamber'
  if (text.includes('reported')) return 'reported'
  if (text.includes('referred to')) return 'in_committee'
  return 'introduced'
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
  const policyArea = body.policyArea

  let bills: any[]
  try {
    bills = await fetchBills(congress, limit, offset, policyArea)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  let created = 0
  let updated = 0
  let failed = 0
  const errors: any[] = []

  for (const bill of bills) {
    try {
      // Congress API list-level uses: type, number, congress, title, introducedDate
      const billType = (bill.type ?? bill.billType ?? 'HR').toUpperCase()
      const billNumber = String(bill.number ?? bill.billNumber ?? '')
      const billCongress = String(bill.congress ?? congress)

      if (!billNumber) throw new Error('Missing bill number')

      // Fetch full details for richer data (sponsors, policyArea, etc.)
      const details = await fetchBillDetails(Number(billCongress), billType, billNumber)
      const src = details ?? bill

      // Safely parse date
      const rawDate = src.introducedDate ?? bill.introducedDate
      const introducedDate = rawDate ? new Date(rawDate) : new Date()

      const data = {
        congress: billCongress,
        billType,
        billNumber,
        title: src.title ?? bill.title ?? 'Untitled',
        shortTitle: src.shortTitle ?? null,
        summary: src.summaries?.[0]?.text ?? null,
        introducedDate,
        latestActionDate: src.latestAction?.actionDate
          ? new Date(src.latestAction.actionDate)
          : null,
        latestActionText: src.latestAction?.text ?? null,
        status: normalizeStatus(src.latestAction?.text ?? '', src.laws ?? []),
        originChamber: src.originChamber ?? bill.originChamber ?? 'House',
        policyArea: src.policyArea?.name ?? bill.policyArea?.name ?? null,
        subjects: [],
        sponsors: src.sponsors?.length
          ? src.sponsors.map((s: any) => ({
              bioguideId: s.bioguideId ?? '',
              firstName: s.firstName ?? '',
              lastName: s.lastName ?? '',
              party: s.party ?? '',
              state: s.state ?? '',
            }))
          : [],
        cosponsors: Prisma.JsonNull,
        actions: Prisma.JsonNull,
      }

      const existing = await prisma.bill.findUnique({
        where: {
          congress_billType_billNumber: {
            congress: data.congress,
            billType: data.billType,
            billNumber: data.billNumber,
          },
        },
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
    } catch (err: any) {
      failed++
      errors.push({
        bill: `${bill.type ?? '?'}${bill.number ?? '?'}`,
        error: err.message,
      })
    }
  }

  return NextResponse.json({
    success: true,
    congress,
    billsFetched: bills.length,
    created,
    updated,
    failed,
    sampleErrors: errors.slice(0, 3),
  })
}

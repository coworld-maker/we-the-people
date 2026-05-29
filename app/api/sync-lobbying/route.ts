// Syncs LDA lobbying firm counts for all bills in the DB.
// Triggered by cron or manually: POST /api/sync-lobbying with Bearer CRON_SECRET.
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getLobbyingFirmCount } from '@/lib/api/lda'

const CRON_SECRET = process.env.CRON_SECRET
const LDA_API_KEY = process.env.LDA_API_KEY

// Without a key: 15 req/min → ~4s between calls. With key: 120 req/min → ~0.5s.
const DELAY_MS = LDA_API_KEY ? 550 : 4100

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const secretHeader = req.headers.get('x-sync-secret')
  return authHeader === `Bearer ${CRON_SECRET}` || secretHeader === CRON_SECRET
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bills = await prisma.bill.findMany({
      select: { id: true, billType: true, billNumber: true },
      orderBy: { latestActionDate: 'desc' },
    })

    let updated = 0
    let errors = 0

    for (const bill of bills) {
      try {
        const count = await getLobbyingFirmCount(bill.billType, bill.billNumber)
        await prisma.bill.update({
          where: { id: bill.id },
          data: { lobbyingFirmCount: count },
        })
        updated++
      } catch {
        errors++
      }
      await delay(DELAY_MS)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      billsProcessed: bills.length,
      updated,
      errors,
    })
  } catch (e) {
    console.error('[sync-lobbying]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

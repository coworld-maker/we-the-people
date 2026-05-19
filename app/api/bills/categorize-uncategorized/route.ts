import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AIService } from '@/lib/services/aiService'

/**
 * POST /api/bills/categorize-uncategorized?limit=10
 *
 * Picks N bills with policyArea = NULL and asks Claude to categorize each.
 * Designed to be invoked repeatedly from the client until `remaining === 0`,
 * so a single request stays well within Vercel's serverless function timeout.
 *
 * Response:
 *   {
 *     processed: 10,
 *     categorized: 9,           // wrote a policy area
 *     skipped: 1,               // model returned NONE
 *     failed: 0,                // exception per bill
 *     remaining: 490,           // bills still uncategorized after this batch
 *   }
 */

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Categorization requires ANTHROPIC_API_KEY' },
      { status: 503 },
    )
  }

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20)

  const uncategorized = await prisma.bill.findMany({
    where: { policyArea: null },
    select: { id: true },
    take: limit,
    orderBy: { introducedDate: 'desc' },
  })

  // Process in parallel — Claude requests are independent, each ~1–2s
  const results = await Promise.allSettled(
    uncategorized.map(b => AIService.categorizeBill(b.id))
  )

  let categorized = 0, skipped = 0, failed = 0
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      if (r.value === null) skipped++
      else categorized++
    } else {
      failed++
      console.error('Categorize failure:', r.reason)
    }
  })

  const remaining = await prisma.bill.count({ where: { policyArea: null } })

  return NextResponse.json({
    processed: uncategorized.length,
    categorized,
    skipped,
    failed,
    remaining,
  })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const remaining = await prisma.bill.count({ where: { policyArea: null } })
  return NextResponse.json({ remaining })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AIService } from '@/lib/services/aiService'

/**
 * GET — return the bill's stored stateImpacts (or null if not yet generated).
 * POST — (re)generate impacts via Claude. Requires ANTHROPIC_API_KEY on the server.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const bill = await prisma.bill.findUnique({
    where: { id },
    select: { stateImpacts: true, stateImpactsAt: true },
  })
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  return NextResponse.json({
    stateImpacts: bill.stateImpacts ?? null,
    generatedAt: bill.stateImpactsAt,
  })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI generation unavailable (ANTHROPIC_API_KEY not configured)' },
      { status: 503 },
    )
  }

  const { id } = await params
  try {
    const impacts = await AIService.analyzeStateImpact(id)
    return NextResponse.json({ stateImpacts: impacts, generatedAt: new Date() })
  } catch (e: any) {
    console.error('State impact generation failed:', e)
    return NextResponse.json({ error: e.message || 'Failed to generate impact analysis' }, { status: 500 })
  }
}

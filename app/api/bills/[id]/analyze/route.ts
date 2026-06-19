import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    console.log(`Starting AI analysis for bill ${id}`)

    const { AIService } = await import('@/lib/services/aiService')
    await AIService.analyzeAndSaveBill(id)

    // Return the generated summary so the client can render it immediately,
    // instead of relying on a router.refresh() that the AISummary component's
    // mount-time useState would ignore (the "have to refresh to see it" bug).
    const { default: prisma } = await import('@/lib/prisma')
    const bill = await prisma.bill.findUnique({
      where: { id },
      select: { aiSummary: true, aiAnalyzedAt: true },
    })

    console.log(`AI analysis complete for bill ${id}`)
    return NextResponse.json({
      success: true,
      summary: bill?.aiSummary ?? null,
      analyzedAt: bill?.aiAnalyzedAt ?? null,
    })
  } catch (error: any) {
    console.error('AI analysis error:', error?.message || error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

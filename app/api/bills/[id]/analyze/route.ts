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
    // Log the real cause server-side, but NEVER return it to the browser: the
    // client renders `details` verbatim, so upstream provider errors leaked to
    // visitors — an exhausted API balance showed them a literal
    // "Your credit balance is too low… go to Plans & Billing" on the bill page.
    console.error('AI analysis error:', error?.message || error)
    return NextResponse.json(
      { error: 'Analysis unavailable' },
      { status: 503 }
    )
  }
}

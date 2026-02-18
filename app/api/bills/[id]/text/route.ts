import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { BillService } = await import('@/lib/services/billService')
    const text = await BillService.fetchAndSaveBillText(id)

    if (!text) {
      return NextResponse.json({
        text: null,
        message: 'No text available for this bill from Congress.gov',
      })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Bill text fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bill text', details: String(error) },
      { status: 500 }
    )
  }
}

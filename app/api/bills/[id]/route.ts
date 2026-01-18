import { NextRequest, NextResponse } from 'next/server'
import { BillService } from '@/lib/services/billService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bill = await BillService.getBillById(id)
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    const stats = await BillService.getBillVoteStats(id)
    
    return NextResponse.json({ bill, stats })
  } catch (error) {
    console.error('Bill API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BillService } from '@/lib/services/billService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await BillService.syncBills()

    return NextResponse.json({
      success: true,
      message: `Synced ${result.count} bills`,
      count: result.count
    })
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { error: 'Failed to sync bills' },
      { status: 500 }
    )
  }
}

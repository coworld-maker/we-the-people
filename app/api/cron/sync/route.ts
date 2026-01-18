import { NextRequest, NextResponse } from 'next/server'
import { BillService } from '@/lib/services/billService'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting scheduled bill sync...')
    const result = await BillService.syncBills()
    console.log(`Synced ${result.count} bills successfully`)

    return NextResponse.json({
      success: true,
      message: `Synced ${result.count} bills`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

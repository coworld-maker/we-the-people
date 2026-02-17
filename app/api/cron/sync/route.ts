import { NextRequest, NextResponse } from 'next/server'
import { BillService } from '@/lib/services/billService'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await BillService.syncBills()

    return NextResponse.json({
      success: true,
      message: `Synced ${result.count} bills`,
      count: result.count,
      skipped: result.skipped || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    )
  }
}

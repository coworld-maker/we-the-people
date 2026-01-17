import { NextRequest, NextResponse } from 'next/server'
import { BillService } from '@/lib/services/billService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      policyArea: searchParams.get('policyArea') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    const result = await BillService.getBills(filters)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Bills API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

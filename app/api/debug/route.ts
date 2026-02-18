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

    // Get bill from database
    const { default: prisma } = await import('@/lib/prisma')
    const bill = await prisma.bill.findUnique({ where: { id } })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' })
    }

    // Call Congress API directly to see raw response
    const API_KEY = process.env.CONGRESS_API_KEY
    const congress = parseInt(bill.congress)
    const billType = bill.billType
    const billNumber = bill.billNumber

    const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/text?api_key=${API_KEY}&format=json`
    
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
    })
    const raw = await response.json()

    return NextResponse.json({
      bill: { congress, billType, billNumber, title: bill.title },
      apiUrl: url.replace(API_KEY || '', 'REDACTED'),
      httpStatus: response.status,
      rawResponse: raw,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

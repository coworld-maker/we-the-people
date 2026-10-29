import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { BillService } = await import('@/lib/services/billService')
    const text = await BillService.fetchAndSaveBillText(id)

    if (!text) {
      // Return the congress.gov URL so the frontend can link to it
      const { default: prisma } = await import('@/lib/prisma')
      const { congressGovBillUrl } = await import('@/lib/congress-url')
      const bill = await prisma.bill.findUnique({ where: { id } })
      const base = bill ? congressGovBillUrl(bill) : null
      const fallbackUrl = base ? `${base}/text` : null

      return NextResponse.json({ text: null, fallbackUrl, message: 'Text not available via API — use the direct link.' })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Bill text error:', error)
    return NextResponse.json({ error: 'Failed to fetch bill text', details: String(error) }, { status: 500 })
  }
}

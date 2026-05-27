import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OpenStatesService } from '@/lib/services/openStatesService'

const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
])

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get('state') ?? '').toUpperCase()
  const limit = Math.min(Number(searchParams.get('limit') ?? 12), 20)

  if (!raw || !VALID_STATES.has(raw)) {
    return NextResponse.json({ error: 'Invalid or missing state code' }, { status: 400 })
  }

  const configured = OpenStatesService.isConfigured()
  const bills = configured ? await OpenStatesService.getRecentBills(raw, limit) : []

  return NextResponse.json({ configured, bills, state: raw })
}

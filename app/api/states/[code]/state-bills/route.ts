import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { OpenStatesService } from '@/lib/services/openStatesService'

const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code: raw } = await params
  const code = raw.toUpperCase()
  if (!VALID_STATES.has(code)) {
    return NextResponse.json({ error: 'Invalid state code' }, { status: 400 })
  }

  const configured = OpenStatesService.isConfigured()
  const bills = await OpenStatesService.getRecentBills(code, 8)

  return NextResponse.json({ configured, bills })
}

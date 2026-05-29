import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CivicService } from '@/lib/services/civicService'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configured = CivicService.isConfigured()
  const elections = await CivicService.getElections()

  return NextResponse.json({ configured, elections })
}

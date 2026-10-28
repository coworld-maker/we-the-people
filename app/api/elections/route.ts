import { NextResponse } from 'next/server'
import { CivicService } from '@/lib/services/civicService'

export async function GET() {

  const configured = CivicService.isConfigured()
  const elections = await CivicService.getElections()

  return NextResponse.json({ configured, elections })
}

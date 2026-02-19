import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import { AlignmentService } from '@/lib/services/alignmentService'

export const maxDuration = 30

export async function GET(request: Request) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const bioguideId = searchParams.get('bioguideId')
  const memberName = searchParams.get('name') || 'Unknown'
  const party = searchParams.get('party') || ''
  const chamber = searchParams.get('chamber') || 'House'
  const state = searchParams.get('state') || ''

  if (!bioguideId) {
    return NextResponse.json({ error: 'bioguideId is required' }, { status: 400 })
  }

  try {
    const result = await AlignmentService.calculateAlignment(
      user.id, bioguideId, memberName, party, chamber, state
    )
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Alignment calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate alignment' }, { status: 500 })
  }
}

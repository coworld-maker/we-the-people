import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { VoteService } from '@/lib/services/voteService'
import { UserService } from '@/lib/services/userService'
import { validateRequest, schemas } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await UserService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = validateRequest(body, schemas.vote)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { billId, position, reasoning, confidence, isAnonymous } = validation.data
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip')

    const vote = await VoteService.castVote(
      user.id,
      billId,
      position,
      reasoning,
      confidence,
      isAnonymous,
      ipAddress || undefined
    )

    return NextResponse.json({ 
      success: true, 
      vote: {
        id: vote.id,
        position: vote.position,
        confidence: vote.confidence,
        createdAt: vote.createdAt
      }
    })
  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      { error: 'Failed to cast vote' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await UserService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const billId = searchParams.get('billId')

    if (billId) {
      const vote = await VoteService.getUserVote(user.id, billId)
      return NextResponse.json({ vote })
    }

    const votes = await VoteService.getUserVotes(user.id)
    const stats = await VoteService.getVoteStats(user.id)

    return NextResponse.json({ votes, stats })
  } catch (error) {
    console.error('Get votes API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await UserService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { billId } = await request.json()

    if (!billId) {
      return NextResponse.json(
        { error: 'billId required' },
        { status: 400 }
      )
    }

    await VoteService.deleteVote(user.id, billId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete vote API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete vote' },
      { status: 500 }
    )
  }
}

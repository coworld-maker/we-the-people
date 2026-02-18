import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/userService'
import { moderateContent } from '@/lib/moderation'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: billId } = await params

    const discussions = await prisma.discussion.findMany({
      where: { billId, parentId: null },
      include: {
        user: {
          select: { id: true, clerkId: true, firstName: true, lastName: true, createdAt: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, clerkId: true, firstName: true, lastName: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ discussions })
  } catch (error) {
    console.error('Discussions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await UserService.getCurrentUser()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id: billId } = await params
    const body = await request.json()
    const { content, parentId } = body

    // Content moderation
    const modResult = moderateContent(content)
    if (!modResult.allowed) {
      return NextResponse.json({ error: modResult.reason }, { status: 400 })
    }

    const bill = await prisma.bill.findUnique({ where: { id: billId } })
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

    if (parentId) {
      const parent = await prisma.discussion.findUnique({ where: { id: parentId } })
      if (!parent) return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
    }

    const discussion = await prisma.discussion.create({
      data: {
        billId,
        userId: user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, clerkId: true, firstName: true, lastName: true, createdAt: true },
        },
      },
    })

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    console.error('Discussions POST error:', error)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}

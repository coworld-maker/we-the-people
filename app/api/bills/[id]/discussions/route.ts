import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserService } from '@/lib/services/userService'
import { isAdminUserId, isModerator } from '@/lib/admin'

// Content moderation (inline — if you have lib/moderation.ts, import from there instead)
function moderateContent(content: string): { ok: boolean; reason?: string } {
  const lower = content.toLowerCase()

  // Block all-caps screaming (more than 70% uppercase and > 20 chars)
  const letters = content.replace(/[^a-zA-Z]/g, '')
  if (letters.length > 20) {
    const upperCount = (content.match(/[A-Z]/g) || []).length
    if (upperCount / letters.length > 0.7) {
      return { ok: false, reason: 'Please avoid writing in all capitals.' }
    }
  }

  // Block spam patterns
  const spamPatterns = [
    /(.)\1{6,}/i,           // Same character 7+ times
    /(buy|sell|free|click|subscribe|follow)\s+(now|here|me)/i,
    /https?:\/\/\S+/i,      // Links (basic)
  ]
  for (const p of spamPatterns) {
    if (p.test(content)) return { ok: false, reason: 'This content was flagged as spam. Please revise.' }
  }

  // Must have some substance
  if (content.trim().length < 3) {
    return { ok: false, reason: 'Comment is too short.' }
  }

  return { ok: true }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: billId } = await params

  const discussions = await prisma.discussion.findMany({
    where: { billId, parentId: null },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, username: true } },
      replies: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, username: true } },
          replies: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, username: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Moderator = env admin OR DB isModerator flag
  const me = await UserService.getCurrentUser()
  const isAdmin = isModerator(userId, me as any)

  return NextResponse.json({ discussions, isAdmin })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if ((user as any).isBanned) {
    return NextResponse.json({ error: 'Your account is suspended from posting.' }, { status: 403 })
  }

  const { id: billId } = await params
  const body = await request.json()
  const { content, parentId } = body

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 })
  }

  // Moderate
  const modResult = moderateContent(content)
  if (!modResult.ok) {
    return NextResponse.json({ error: modResult.reason }, { status: 400 })
  }

  // Verify bill exists
  const bill = await prisma.bill.findUnique({ where: { id: billId } })
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  // If reply, verify parent exists and limit depth
  if (parentId) {
    const parent = await prisma.discussion.findUnique({
      where: { id: parentId },
      include: { parent: true },
    })
    if (!parent) return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
    // Allow max 2 levels of nesting
    if (parent.parent?.parentId) {
      return NextResponse.json({ error: 'Maximum reply depth reached' }, { status: 400 })
    }
  }

  const discussion = await prisma.discussion.create({
    data: {
      content: content.trim(),
      billId,
      userId: user.id,
      parentId: parentId || null,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, username: true } },
    },
  })

  return NextResponse.json({ discussion })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only moderators (env admins or DB isModerator) can delete
  const me = await UserService.getCurrentUser()
  if (!isModerator(clerkUserId, me as any)) {
    return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('commentId')

  if (!commentId) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
  }

  // Resolve any open reports against this comment, then delete replies + comment
  await (prisma as any).contentReport.updateMany({
    where: { discussionId: commentId, status: 'open' },
    data: { status: 'actioned', reviewedAt: new Date() },
  })
  await prisma.discussion.deleteMany({ where: { parentId: commentId } })
  await prisma.discussion.delete({ where: { id: commentId } })

  return NextResponse.json({ deleted: true })
}

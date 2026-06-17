/**
 * POST /api/reports — report a discussion comment { discussionId, reason, detail? }
 * GET  /api/reports — moderator-only: list open reports with context
 *
 * The reporting rail the council gated all UGC behind. One report per user
 * per comment (DB unique). Auto-hides nothing — flags for human review.
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserService } from '@/lib/services/userService'
import { isModerator } from '@/lib/admin'

const REASONS = new Set(['spam', 'harassment', 'misinfo', 'offensive', 'other'])

export async function POST(req: Request) {
  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const discussionId = typeof body?.discussionId === 'string' ? body.discussionId : null
  const reason = typeof body?.reason === 'string' ? body.reason : null
  if (!discussionId || !reason || !REASONS.has(reason)) {
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
  }

  const comment = await prisma.discussion.findUnique({
    where: { id: discussionId },
    select: { id: true },
  })
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  try {
    await (prisma as any).contentReport.upsert({
      where: { discussionId_reporterId: { discussionId, reporterId: user.id } },
      create: {
        discussionId,
        reporterId: user.id,
        reason,
        detail: typeof body?.detail === 'string' ? body.detail.slice(0, 500) : null,
      },
      update: {}, // already reported — silently succeed (idempotent)
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not file report' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  const user = await UserService.getCurrentUser()
  if (!isModerator(userId, user as any)) {
    return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : null
  const status = body?.status === 'dismissed' || body?.status === 'reviewed' ? body.status : null
  if (!id || !status) return NextResponse.json({ error: 'Invalid update' }, { status: 400 })

  await (prisma as any).contentReport.update({
    where: { id },
    data: { status, reviewedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { userId } = await auth()
  const user = await UserService.getCurrentUser()
  if (!isModerator(userId, user as any)) {
    return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  }

  const reports = await (prisma as any).contentReport.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Attach the reported comment text + author for the queue
  const ids = reports.map((r: any) => r.discussionId)
  const comments = await prisma.discussion.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, content: true, billId: true,
      user: { select: { username: true, firstName: true } },
    },
  })
  const byId = new Map(comments.map(c => [c.id, c]))

  return NextResponse.json({
    reports: reports.map((r: any) => ({ ...r, comment: byId.get(r.discussionId) ?? null })),
  })
}

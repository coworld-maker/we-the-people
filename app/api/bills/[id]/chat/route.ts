/**
 * GET  /api/bills/[id]/chat?since=<iso>  — recent messages (incremental poll)
 * POST /api/bills/[id]/chat               — send a message
 * DELETE /api/bills/[id]/chat?messageId=  — moderator removes a message
 *
 * Live (polled) per-bill chat. Gated behind the moderation rails from the
 * usernames+moderation work: username required, banned users blocked,
 * per-user rate limit, content moderation reused, moderators can delete.
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserService } from '@/lib/services/userService'
import { isModerator } from '@/lib/admin'

const MAX_LEN = 500
const RATE_MS = 3000 // one message per user per 3s

function moderate(content: string): { ok: boolean; reason?: string } {
  const trimmed = content.trim()
  if (trimmed.length < 1) return { ok: false, reason: 'Message is empty.' }
  const letters = content.replace(/[^a-zA-Z]/g, '')
  if (letters.length > 15) {
    const upper = (content.match(/[A-Z]/g) || []).length
    if (upper / letters.length > 0.7) return { ok: false, reason: 'Please don’t shout in all caps.' }
  }
  if (/(.)\1{6,}/.test(content)) return { ok: false, reason: 'Message looks like spam.' }
  if (/https?:\/\/\S+/i.test(content)) return { ok: false, reason: 'Links aren’t allowed in chat.' }
  return { ok: true }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: billId } = await params
  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')

  const messages = await (prisma as any).chatMessage.findMany({
    where: {
      billId,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  const me = await UserService.getCurrentUser()
  return NextResponse.json({ messages, isModerator: isModerator(userId, me as any) })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if ((user as any).isBanned) {
    return NextResponse.json({ error: 'Your account is suspended from posting.' }, { status: 403 })
  }
  const username = (user as any).username
  if (!username) {
    return NextResponse.json({ error: 'Choose a username before chatting.', needsUsername: true }, { status: 400 })
  }

  const { id: billId } = await params
  const body = await req.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content : ''
  if (content.length > MAX_LEN) {
    return NextResponse.json({ error: `Message too long (max ${MAX_LEN}).` }, { status: 400 })
  }
  const mod = moderate(content)
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 400 })

  // Rate limit: reject if this user posted within RATE_MS
  const last = await (prisma as any).chatMessage.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  if (last && Date.now() - new Date(last.createdAt).getTime() < RATE_MS) {
    return NextResponse.json({ error: 'You’re sending messages too fast.' }, { status: 429 })
  }

  const message = await (prisma as any).chatMessage.create({
    data: { billId, userId: user.id, username, content: content.trim() },
  })
  return NextResponse.json({ message })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = await UserService.getCurrentUser()
  if (!isModerator(userId, me as any)) {
    return NextResponse.json({ error: 'Moderator access required' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const messageId = searchParams.get('messageId')
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })

  await (prisma as any).chatMessage.delete({ where: { id: messageId } })
  return NextResponse.json({ deleted: true })
}

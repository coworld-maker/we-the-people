/**
 * GET  /api/user/username — current user's username (or null)
 * POST /api/user/username — set/change username { username }
 *
 * Enforces validation + case-insensitive uniqueness. Username is the public
 * pseudonym shown in discussions, so people can post political opinions
 * without exposing their real name.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { UserService } from '@/lib/services/userService'
import { validateUsername } from '@/lib/username'

export async function GET() {
  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ username: (user as any).username ?? null })
}

export async function POST(req: Request) {
  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const result = validateUsername(body?.username ?? '')
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 })

  // Case-insensitive uniqueness — block "JohnQ" if "johnq" exists
  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: result.value, mode: 'insensitive' },
      NOT: { id: user.id },
    },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ error: 'That username is taken.' }, { status: 409 })

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { username: result.value },
    })
    return NextResponse.json({ username: result.value })
  } catch {
    return NextResponse.json({ error: 'That username is taken.' }, { status: 409 })
  }
}

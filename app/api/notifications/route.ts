import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import prisma from '@/lib/prisma'

// GET /api/notifications  → { notifications, unreadCount }
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      bill: { select: { id: true, shortTitle: true, title: true } },
    },
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return NextResponse.json({ notifications, unreadCount })
}

// PATCH /api/notifications  → mark all as read
export async function PATCH() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}

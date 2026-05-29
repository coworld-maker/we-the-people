import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import prisma from '@/lib/prisma'

// GET /api/bills/follow?billId=xxx  → { following: boolean }
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const billId = searchParams.get('billId')
  if (!billId) return NextResponse.json({ error: 'billId required' }, { status: 400 })

  const follow = await (prisma as any).billFollow.findUnique({
    where: { userId_billId: { userId: user.id, billId } },
  })

  return NextResponse.json({ following: !!follow })
}

// POST /api/bills/follow  { billId } → toggle follow
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await UserService.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { billId } = await req.json()
  if (!billId) return NextResponse.json({ error: 'billId required' }, { status: 400 })

  const existing = await (prisma as any).billFollow.findUnique({
    where: { userId_billId: { userId: user.id, billId } },
  })

  if (existing) {
    await (prisma as any).billFollow.delete({
      where: { userId_billId: { userId: user.id, billId } },
    })
    return NextResponse.json({ following: false })
  } else {
    await (prisma as any).billFollow.create({
      data: { userId: user.id, billId },
    })
    return NextResponse.json({ following: true })
  }
}

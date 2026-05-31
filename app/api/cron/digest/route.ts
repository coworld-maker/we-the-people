/**
 * Weekly digest cron — runs every Monday at 8 AM UTC (configured in vercel.json).
 *
 * For each user with emailNotifications = true:
 *   1. Fetch bills they're following that had activity in the past 7 days.
 *   2. Fetch up to 3 trending bills (not followed, also active this week).
 *   3. Skip the send if there's nothing interesting to say.
 *   4. Send via Resend (no npm package — plain fetch to the REST API).
 *
 * Auth: Vercel cron header OR Authorization: Bearer <CRON_SECRET>
 *
 * To trigger manually:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://www.democracyunlocked.com/api/cron/digest
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { EncryptionService } from '@/lib/security/encryption'
import { sendEmail, buildDigestHtml } from '@/lib/email'

const CRON_SECRET = process.env.CRON_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.democracyunlocked.com'

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-vercel-cron')
  return (
    cronHeader === '1' ||
    authHeader === `Bearer ${CRON_SECRET}`
  )
}

function decryptEmail(user: { emailEncrypted: string; emailIv: string; emailTag: string }): string | null {
  try {
    return EncryptionService.decrypt({
      encrypted: user.emailEncrypted,
      iv: user.emailIv,
      tag: user.emailTag,
    })
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Active bills this week (for trending section)
  const trendingBills = await prisma.bill.findMany({
    where: { latestActionDate: { gte: sevenDaysAgo } },
    orderBy: { latestActionDate: 'desc' },
    take: 5,
    select: {
      id: true, title: true, shortTitle: true, status: true,
      latestActionText: true, latestActionDate: true,
    },
  })

  // Users with email digests enabled
  const users = await prisma.user.findMany({
    where: { emailNotifications: true },
    select: {
      id: true,
      firstName: true,
      emailEncrypted: true,
      emailIv: true,
      emailTag: true,
      billFollows: {
        select: {
          bill: {
            select: {
              id: true, title: true, shortTitle: true, status: true,
              latestActionText: true, latestActionDate: true,
            },
          },
        },
        where: {
          bill: { latestActionDate: { gte: sevenDaysAgo } },
        },
      },
    },
  })

  // Build per-user send tasks, skipping anyone with no email or nothing to say
  async function sendToUser(user: (typeof users)[number]): Promise<'sent' | 'skipped'> {
    const email = decryptEmail(user)
    if (!email) return 'skipped'

    const followedBills = user.billFollows
      .map(f => f.bill)
      .filter(Boolean)
      .map(b => ({ ...b!, url: `${BASE_URL}/bills/${b!.id}` }))

    const followedIds = new Set(followedBills.map(b => b.id))
    const trending = trendingBills
      .filter(b => !followedIds.has(b.id))
      .slice(0, 3)
      .map(b => ({ ...b, url: `${BASE_URL}/bills/${b.id}` }))

    if (followedBills.length === 0 && trending.length === 0) return 'skipped'

    const html = buildDigestHtml({
      firstName: user.firstName || '',
      followedBills,
      trendingBills: trending,
      unsubUrl: `${BASE_URL}/account/privacy`,
    })

    const ok = await sendEmail({
      to: email,
      subject: followedBills.length > 0
        ? `${followedBills.length} bill${followedBills.length > 1 ? 's' : ''} you're following moved this week`
        : 'What moved in Congress this week',
      html,
    })

    return ok ? 'sent' : 'skipped'
  }

  // Send in batches of 10 to stay well under Vercel's timeout
  const BATCH = 10
  let sent = 0
  let skipped = 0

  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH)
    const results = await Promise.allSettled(batch.map(sendToUser))
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value === 'sent') sent++
      else skipped++
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    trendingCount: trendingBills.length,
    userCount: users.length,
  })
}

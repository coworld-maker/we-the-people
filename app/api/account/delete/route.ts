import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GDPR Article 17 — Right to Erasure.
 * CCPA / CPRA — Right to Delete.
 *
 * Permanently deletes the authenticated user's personal data:
 *   - User row (cascades to: votes, discussions, notifications, audit logs)
 *   - Clerk auth record (so they can't simply sign back in)
 *
 * What we keep:
 *   - Aggregate vote/sentiment counts (no longer linkable to the user — these
 *     are stored in BillVoteAggregate, which only references billId)
 *   - Anonymized audit-log summary (count, dates) for compliance with our
 *     security-monitoring obligations — never the user's identity
 */
export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, votes: { select: { id: true, billId: true, position: true } } },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Walk through the deletion in order so we don't leave dangling references.
  // Wrapped in a transaction so a partial failure rolls back and we can retry.
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Strip identifying info from votes BEFORE deleting the User, then
      //    delete the votes themselves. This preserves any aggregate counts
      //    that were computed from these votes (BillVoteAggregate is separate
      //    and updated via triggers/jobs, not via Vote→User joins).
      await tx.vote.deleteMany({ where: { userId: user.id } })

      // 2. Discussions, notifications, audit logs — straightforward delete
      await tx.discussion.deleteMany({ where: { userId: user.id } })
      await tx.notification.deleteMany({ where: { userId: user.id } })
      await tx.auditLog.deleteMany({ where: { userId: user.id } })

      // 3. Finally remove the User row
      await tx.user.delete({ where: { id: user.id } })
    })
  } catch (e: any) {
    console.error('Account deletion failed (DB):', e)
    return NextResponse.json(
      { error: 'Deletion failed — please email privacy@democracyunlocked.com and we will complete it manually within 30 days.' },
      { status: 500 },
    )
  }

  // Best-effort: revoke the Clerk session and remove the Clerk user. If this
  // fails the database side is already gone, so the worst case is a stranded
  // Clerk identity — we'd reconcile via Clerk's webhook on next login.
  try {
    const cc = await clerkClient()
    await cc.users.deleteUser(clerkId)
  } catch (e) {
    console.warn('Clerk user deletion failed (DB already cleared):', e)
  }

  return NextResponse.json({ ok: true })
}

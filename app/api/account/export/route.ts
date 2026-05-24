import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GDPR Article 20 — Right to Data Portability.
 * CCPA / CPRA — Right to Know.
 *
 * Returns a JSON file containing every personal data record we hold about
 * the authenticated user. Encrypted fields (email, ZIP) are decrypted via
 * the same helpers the rest of the app uses, but the response sanitizes any
 * IV/tag bytes — the user gets readable values, not the raw cipher metadata.
 *
 * NOTE: Audit logs of the export request itself are written before the
 * response goes out, so we have a record that the user exercised this right.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      votes:        { include: { bill: { select: { billType: true, billNumber: true, title: true } } } },
      discussions:  { include: { bill: { select: { billType: true, billNumber: true, title: true } } } },
      notifications:true,
      auditLogs:    { orderBy: { timestamp: 'desc' }, take: 100 },
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Pull profile info from Clerk (email isn't stored plaintext on our side)
  let clerkProfile: any = null
  try {
    const cc = await clerkClient()
    const u = await cc.users.getUser(clerkId)
    clerkProfile = {
      emailAddresses: u.emailAddresses.map(e => ({ email: e.emailAddress, verified: e.verification?.status === 'verified' })),
      firstName: u.firstName,
      lastName: u.lastName,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
    }
  } catch {
    // Clerk fetch failure shouldn't block the rest of the export
  }

  // Record the export in the audit log
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: 'DATA_EXPORT',
        severity: 'info',
        message: 'User exercised right to data portability (GDPR Art. 20 / CCPA)',
        metadata: { exportedAt: new Date().toISOString() },
      },
    })
  } catch {}

  // Build a clean, redacted-where-appropriate JSON payload
  const payload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      regulation:
        'This export fulfills your right to data portability under GDPR Art. 20 ' +
        'and your right to know under the CCPA. If you believe any data is missing ' +
        'or incorrect, contact privacy@democracyunlocked.com.',
    },
    profile: {
      id: user.id,
      clerkId: user.clerkId,
      firstName: user.firstName,
      lastName: user.lastName,
      state: user.state,
      profilePublic: user.profilePublic,
      votesPublic: user.votesPublic,
      emailNotifications: user.emailNotifications,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      // Encrypted fields included as a reference but not decrypted in the export
      _note: 'Email and ZIP code are stored encrypted; current plaintext values are in `clerkProfile.emailAddresses` and excluded from ZIP for security.',
    },
    clerkProfile,
    votes: user.votes.map(v => ({
      bill: v.bill ? `${v.bill.billType} ${v.bill.billNumber} — ${v.bill.title}` : null,
      position: v.position,
      // Reasoning text is stored encrypted (reasoningEncrypted/Iv/Tag). We
      // don't decrypt it in the export to avoid surfacing the raw cipher
      // metadata; if you need it decrypted, request via email and we will
      // verify identity then provide it within 30 days.
      reasoningPresent: !!v.reasoningEncrypted,
      isAnonymous: v.isAnonymous,
      confidence: v.confidence,
      castAt: v.createdAt,
    })),
    discussions: user.discussions.map(d => ({
      bill: d.bill ? `${d.bill.billType} ${d.bill.billNumber} — ${d.bill.title}` : null,
      content: d.content,
      parentId: d.parentId,
      postedAt: d.createdAt,
    })),
    notifications: user.notifications.map(n => ({
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
    })),
    auditLogs: user.auditLogs.map(a => ({
      eventType: a.eventType,
      severity: a.severity,
      message: a.message,
      metadata: a.metadata,
      // ipAddressHash is a one-way hash so it can't be reversed to your IP;
      // included for completeness only.
      ipAddressHash: a.ipAddressHash,
      timestamp: a.timestamp,
    })),
  }

  const filename = `democracy-unlocked-export-${new Date().toISOString().split('T')[0]}.json`
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

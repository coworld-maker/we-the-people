/**
 * POST /api/webhooks/inbound-email — Resend inbound mail forwarder.
 *
 * Mail to privacy@ / legal@democracyunlocked.com reaches Resend (the domain's
 * MX) and is posted here; this forwards it to INBOUND_FORWARD_TO until real
 * mailboxes exist. Those addresses are published in the Privacy Policy and
 * Terms with a 30-day reply promise, so losing mail silently is the failure
 * this prevents.
 *
 * Public route (Resend has no Clerk session) but NOT unauthenticated: every
 * request must carry a valid Svix signature made with RESEND_WEBHOOK_SECRET.
 */

import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { parseInbound, forwardSubject, forwardHtml, verifySignature } from '@/lib/data/inboundEmail'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const forwardTo = process.env.INBOUND_FORWARD_TO
  if (!secret || !forwardTo) {
    console.error('[inbound-email] RESEND_WEBHOOK_SECRET or INBOUND_FORWARD_TO not set — cannot forward')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  // Raw body: the signature covers the exact bytes Resend sent.
  const body = await req.text()
  const ok = verifySignature({
    secret,
    id: req.headers.get('svix-id') ?? '',
    timestamp: req.headers.get('svix-timestamp') ?? '',
    header: req.headers.get('svix-signature') ?? '',
    body,
  })
  if (!ok) {
    console.warn('[inbound-email] rejected: bad or missing signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = parseInbound(payload)
  if (!email) {
    // A delivery or bounce notification rather than a message: acknowledge it
    // so Resend doesn't retry, but forward nothing.
    console.warn('[inbound-email] no forwardable message in payload')
    return NextResponse.json({ ok: true, forwarded: false })
  }

  const sent = await sendEmail({
    to: forwardTo,
    subject: forwardSubject(email),
    html: forwardHtml(email),
    // Replying goes straight back to whoever wrote in.
    replyTo: email.from,
  })

  if (!sent) {
    // 500 makes Resend retry — better than dropping a privacy request.
    console.error('[inbound-email] forward failed for message to', email.to.join(', '))
    return NextResponse.json({ error: 'Forward failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, forwarded: true })
}

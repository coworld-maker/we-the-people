/**
 * Inbound mail: verify the webhook, read the message, build the forward.
 *
 * Mail to privacy@ / legal@democracyunlocked.com is accepted by Resend inbound
 * (the domain's MX) and, until there are real mailboxes, forwarded to whoever
 * INBOUND_FORWARD_TO names. Those addresses are published in the Privacy
 * Policy and Terms and promise a reply within 30 days, so silent loss is the
 * failure to avoid.
 *
 * Pure functions, so the parsing and signature rules are testable without a
 * network or a live webhook.
 */

import { createHmac, timingSafeEqual } from 'crypto'

export interface InboundEmail {
  from: string
  to: string[]
  subject: string
  text?: string
  html?: string
  attachments: number
}

const MAX_SUBJECT = 200
const MAX_BODY = 100_000

/** Addresses arrive as "a@b.com", {address}, {email}, or arrays of those. */
function addresses(value: unknown): string[] {
  const one = (v: unknown): string | null => {
    if (typeof v === 'string') return v.trim() || null
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      const a = o.address ?? o.email
      if (typeof a === 'string') return a.trim() || null
    }
    return null
  }
  const list = Array.isArray(value) ? value : [value]
  return list.map(one).filter((v): v is string => !!v)
}

/**
 * Read a Resend inbound webhook body. The message may sit at the top level or
 * under `data`; unknown shapes return null rather than forwarding nonsense.
 */
export function parseInbound(body: unknown): InboundEmail | null {
  if (!body || typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  const data = (root.data && typeof root.data === 'object' ? root.data : root) as Record<string, unknown>

  const from = addresses(data.from)[0]
  if (!from) return null

  const text = typeof data.text === 'string' ? data.text.slice(0, MAX_BODY) : undefined
  const html = typeof data.html === 'string' ? data.html.slice(0, MAX_BODY) : undefined
  if (!text && !html) return null

  return {
    from,
    to: addresses(data.to),
    subject: typeof data.subject === 'string' ? data.subject.slice(0, MAX_SUBJECT) : '(no subject)',
    text,
    html,
    attachments: Array.isArray(data.attachments) ? data.attachments.length : 0,
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Subject that says which published address was written to. */
export function forwardSubject(email: InboundEmail): string {
  const box = email.to[0]?.split('@')[0]
  return `[${box || 'inbox'}] ${email.subject}`.slice(0, MAX_SUBJECT)
}

/**
 * The forwarded message: a short header saying who wrote in and to which
 * address, then their message. The original HTML is NOT re-rendered — a
 * stranger's markup is shown as text, so nothing in it can act on the reader.
 */
export function forwardHtml(email: InboundEmail): string {
  const body = email.text ?? email.html ?? ''
  const note = email.attachments
    ? `<p style="color:#7E5E12"><strong>${email.attachments} attachment(s) were not forwarded.</strong> Open them in Resend.</p>`
    : ''
  return [
    '<div style="font-family:system-ui,sans-serif;font-size:14px;color:#111827">',
    '<p style="color:#4B5563">Forwarded from Democracy Unlocked inbound mail.</p>',
    `<p><strong>From:</strong> ${escapeHtml(email.from)}<br>`,
    `<strong>To:</strong> ${escapeHtml(email.to.join(', ') || 'unknown')}<br>`,
    `<strong>Subject:</strong> ${escapeHtml(email.subject)}</p>`,
    note,
    '<hr style="border:none;border-top:1px solid #E5E7EB">',
    `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(body)}</pre>`,
    '</div>',
  ].join('')
}

/**
 * Resend signs webhooks the Svix way: HMAC-SHA256 over "<id>.<timestamp>.<body>"
 * with the secret after "whsec_", base64. The header can carry several
 * space-separated "v1,<sig>" values during key rotation; any match passes.
 * Timestamps outside the tolerance are rejected, so a captured request can't
 * be replayed later.
 */
export function verifySignature(opts: {
  secret: string
  id: string
  timestamp: string
  body: string
  header: string
  nowSeconds?: number
  toleranceSeconds?: number
}): boolean {
  const { secret, id, timestamp, body, header } = opts
  if (!secret || !id || !timestamp || !header) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000)
  const tolerance = opts.toleranceSeconds ?? 300
  if (Math.abs(now - ts) > tolerance) return false

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')
  const expectedBuf = Buffer.from(expected)

  return header.split(' ').some(part => {
    const sig = part.startsWith('v1,') ? part.slice(3) : part
    const buf = Buffer.from(sig)
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf)
  })
}

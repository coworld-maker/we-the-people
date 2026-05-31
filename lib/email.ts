/**
 * Thin email sender — calls the Resend REST API directly.
 * No npm package needed; set RESEND_API_KEY in Vercel env vars.
 *
 * Get your key at https://resend.com → API Keys.
 * Add a verified "From" domain (democracyunlocked.com) under Domains.
 */

const FROM = 'Democracy Unlocked <updates@democracyunlocked.com>'
const RESEND_URL = 'https://api.resend.com/emails'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping send')
    return false
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[email] Resend error:', res.status, err)
      return false
    }

    return true
  } catch (e) {
    console.error('[email] fetch failed:', e)
    return false
  }
}

// ---------------------------------------------------------------------------
// Digest email template
// ---------------------------------------------------------------------------

interface DigestBill {
  title: string
  shortTitle: string | null
  status: string
  latestActionText: string | null
  latestActionDate: Date | null
  url: string
}

interface DigestData {
  firstName: string
  followedBills: DigestBill[]   // bills they follow that moved this week
  trendingBills: DigestBill[]   // top bills by recent action (non-followed)
  unsubUrl: string
}

const STATUS_LABEL: Record<string, string> = {
  enacted: 'Enacted',
  passed_both: 'Passed Congress',
  passed_chamber: 'Passed a Chamber',
  reported: 'Left Committee',
  in_committee: 'Active in Committee',
  introduced: 'New Activity',
}

function billRow(bill: DigestBill): string {
  const name = escapeHtml(bill.shortTitle || bill.title)
  const status = escapeHtml(STATUS_LABEL[bill.status] || 'Updated')
  const url = encodeURI(bill.url)
  const date = bill.latestActionDate
    ? new Date(bill.latestActionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
        <a href="${url}" style="font-weight:600;color:#2563eb;text-decoration:none;font-size:14px;line-height:1.4;">${name}</a>
        <div style="margin-top:4px;font-size:12px;color:#6b7280;">
          <span style="display:inline-block;background:#dbeafe;color:#1d4ed8;padding:1px 8px;border-radius:9999px;font-weight:600;">
            ${status}
          </span>
          ${date ? `<span style="margin-left:8px;">${escapeHtml(date)}</span>` : ''}
        </div>
        ${bill.latestActionText ? `<div style="margin-top:4px;font-size:12px;color:#9ca3af;line-height:1.4;">${escapeHtml(bill.latestActionText)}</div>` : ''}
      </td>
    </tr>`
}

export function buildDigestHtml(data: DigestData): string {
  const greetName = data.firstName || 'Citizen'
  const hasFollowed = data.followedBills.length > 0
  const hasTrending = data.trendingBills.length > 0

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your weekly civic digest</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:28px 32px;">
            <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-.3px;">Democracy Unlocked</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Your weekly civic digest</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">Hey ${greetName} 👋</p>
            <p style="margin:8px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
              Here's what moved in Congress this week that you should know about.
            </p>
          </td>
        </tr>

        ${hasFollowed ? `
        <!-- Bills you follow -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;">Bills you're following</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${data.followedBills.map(billRow).join('')}
            </table>
          </td>
        </tr>` : ''}

        ${hasTrending ? `
        <!-- Also moving -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;">
              ${hasFollowed ? 'Also moving this week' : 'Moving in Congress this week'}
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${data.trendingBills.map(billRow).join('')}
            </table>
          </td>
        </tr>` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:28px 32px;">
            <a href="https://www.democracyunlocked.com/bills"
               style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Browse all bills →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
              © ${new Date().getFullYear()} Democracy Unlocked · Not affiliated with the U.S. Government<br/>
              Bill data sourced from Congress.gov API · AI summaries should be verified before acting<br/>
              <a href="${data.unsubUrl}" style="color:#9ca3af;">Unsubscribe from digest emails</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

import type { NextRequest } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Shared auth gate for cron/sync routes.
 *
 * Returns false when CRON_SECRET is unset, so a missing env var can never
 * produce an "undefined === undefined" / "Bearer undefined" bypass that
 * would leave a sync endpoint publicly callable.
 *
 * Accepts either `Authorization: Bearer <CRON_SECRET>` (Vercel cron sends
 * this automatically when CRON_SECRET is set; the orchestrator sends it too)
 * or `x-sync-secret: <CRON_SECRET>` (external scripts + the GitHub Actions
 * workflow). Deliberately does NOT trust the `x-vercel-cron` header: it is
 * client-suppliable on external requests, so accepting it would re-open the
 * public access this helper exists to block.
 */
export function checkSyncAuth(req: NextRequest): boolean {
  if (!CRON_SECRET) return false

  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${CRON_SECRET}`) return true

  const secretHeader = req.headers.get('x-sync-secret')
  if (secretHeader === CRON_SECRET) return true

  return false
}

import type { NextRequest } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Shared auth gate for cron/sync routes.
 *
 * Returns false when CRON_SECRET is unset, so a missing env var can never
 * produce an "undefined === undefined" / "Bearer undefined" bypass that
 * would leave a sync endpoint publicly callable.
 *
 * Accepts either `Authorization: Bearer <CRON_SECRET>` (Vercel cron + the
 * orchestrator) or `x-sync-secret: <CRON_SECRET>` (external scripts + the
 * GitHub Actions workflow). When `allowVercelCron` is set, the platform's
 * unforgeable `x-vercel-cron` header is also accepted.
 */
export function checkSyncAuth(
  req: NextRequest,
  opts: { allowVercelCron?: boolean } = {}
): boolean {
  if (!CRON_SECRET) return false

  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${CRON_SECRET}`) return true

  const secretHeader = req.headers.get('x-sync-secret')
  if (secretHeader === CRON_SECRET) return true

  if (opts.allowVercelCron && req.headers.get('x-vercel-cron') === '1') return true

  return false
}

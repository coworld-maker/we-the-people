// app/api/cron/sync/route.ts
// Daily sync endpoint — called by GitHub Actions at 2AM UTC
// Syncs: bills, congress member votes, and representatives
import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;
// Important: must point at the WWW host (the apex 301-redirects to www
// and fetch() strips Authorization headers across that hop). Override
// via NEXT_PUBLIC_APP_URL for preview deploys.
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.democracyunlocked.com';

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const secretHeader = req.headers.get('x-sync-secret');
  return authHeader === `Bearer ${CRON_SECRET}` || secretHeader === CRON_SECRET;
}

async function callSync(path: string, body: object, secret: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: 'Non-JSON response' }));
  return { status: res.status, ...data };
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = CRON_SECRET ?? '';
  const results: Record<string, any> = {};

  console.log('[cron/sync] Starting daily sync...');

  // 1. Sync recent bills from Congress.gov (119th Congress)
  try {
    results.bills = await callSync('/api/sync-bills', { limit: 50 }, secret);
    console.log('[cron/sync] Bills:', results.bills);
  } catch (e) {
    results.bills = { error: String(e) };
  }

  // 2. Sync current Congress members (Representatives table)
  try {
    results.representatives = await callSync('/api/sync-representatives', {}, secret);
    console.log('[cron/sync] Representatives:', results.representatives);
  } catch (e) {
    results.representatives = { error: String(e) };
  }

  // 3. Sync House member votes (119th Congress, session 1) — process 50 roll calls per run
  try {
    results.houseVotes = await callSync(
      '/api/sync-congress-votes',
      { congress: 119, session: 1, chamber: 'house', maxVotes: 50 },
      secret
    );
    console.log('[cron/sync] House votes:', results.houseVotes);
  } catch (e) {
    results.houseVotes = { error: String(e) };
  }

  // 4. Sync Senate member votes (119th Congress, session 1)
  try {
    results.senateVotes = await callSync(
      '/api/sync-congress-votes',
      { congress: 119, session: 1, chamber: 'senate', maxVotes: 50 },
      secret
    );
    console.log('[cron/sync] Senate votes:', results.senateVotes);
  } catch (e) {
    results.senateVotes = { error: String(e) };
  }

  console.log('[cron/sync] Complete:', results);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}

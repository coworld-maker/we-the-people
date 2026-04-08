// app/api/sync-senator-lis-ids/route.ts
//
// One-time (or periodic) route to populate lisId on Senator records.
// Senate.gov vote XML uses LIS member IDs (e.g. "S428"). We need to
// translate them to bioguide IDs. This endpoint fetches each senator's
// Congress.gov detail page to get their lisId and stores it in the DB.
//
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = 'https://api.congress.gov/v3';

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const secretHeader = req.headers.get('x-sync-secret');
  return authHeader === `Bearer ${CRON_SECRET}` || secretHeader === CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all senators (or just those missing lisId if offset provided)
  const body = await req.json().catch(() => ({}));
  const onlyMissing = body.onlyMissing !== false; // default: only fill gaps

  const senators = await prisma.representative.findMany({
    where: {
      chamber: 'Senate',
      ...(onlyMissing ? { lisId: null } : {}),
    },
    select: { bioguideId: true, lisId: true },
  });

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const senator of senators) {
    try {
      const url = `${BASE_URL}/member/${senator.bioguideId}?format=json&api_key=${CONGRESS_API_KEY}`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) {
        errors.push(`${senator.bioguideId}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      // Congress.gov detail endpoint has lisId at member.lisId
      const lisId = data.member?.lisId ?? data.member?.identifiers?.lisId;
      if (lisId) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Representative" SET "lisId" = $1 WHERE "bioguideId" = $2`,
          String(lisId),
          senator.bioguideId
        );
        synced++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push(`${senator.bioguideId}: ${String(err)}`);
    }
    await new Promise(r => setTimeout(r, 80)); // ~80ms between calls → ~8s for 100 senators
  }

  return NextResponse.json({ success: true, synced, skipped, total: senators.length, errors: errors.slice(0, 10) });
}

export async function GET(req: NextRequest) {
  return POST(req);
}

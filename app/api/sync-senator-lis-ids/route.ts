// app/api/sync-senator-lis-ids/route.ts
//
// Populates lisId on Senator Representative records.
// Senate.gov vote XML uses LIS member IDs (e.g. "S428"). We translate
// them to bioguide IDs by fetching each senator's Congress.gov detail page.
// Uses parallel fetches (concurrency=5) to complete in ~8 seconds.
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

async function fetchLisId(bioguideId: string): Promise<string | null> {
  try {
    const url = `${BASE_URL}/member/${bioguideId}?format=json&api_key=${CONGRESS_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.member?.lisId ?? data.member?.identifiers?.lisId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const onlyMissing = body.onlyMissing !== false; // default: only fill gaps

  // Debug mode: return raw Senate vote XML member block to inspect structure
  if (body.debug) {
    const url = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00010.xml`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    const xml = await res.text();
    // Return first 3 member blocks
    const members: string[] = [];
    const memberRegex = /<member>([\s\S]*?)<\/member>/g;
    let m; let count = 0;
    while ((m = memberRegex.exec(xml)) !== null && count < 3) {
      members.push(m[0]);
      count++;
    }
    return NextResponse.json({ status: res.status, members });
  }

  const senators = await prisma.representative.findMany({
    where: {
      chamber: 'Senate',
      ...(onlyMissing ? { lisId: null } : {}),
    },
    select: { bioguideId: true },
  });

  let synced = 0;
  let notFound = 0;
  const errors: string[] = [];

  // Process in parallel batches of 5 to stay well under Vercel timeout
  const CONCURRENCY = 5;
  for (let i = 0; i < senators.length; i += CONCURRENCY) {
    const batch = senators.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async ({ bioguideId }) => {
      try {
        const lisId = await fetchLisId(bioguideId);
        if (lisId) {
          await prisma.$executeRawUnsafe(
            `UPDATE "Representative" SET "lisId" = $1 WHERE "bioguideId" = $2`,
            String(lisId),
            bioguideId
          );
          synced++;
        } else {
          notFound++;
        }
      } catch (err) {
        errors.push(`${bioguideId}: ${String(err)}`);
      }
    }));
    // Small pause between batches to respect rate limits
    if (i + CONCURRENCY < senators.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  return NextResponse.json({
    success: true,
    synced,
    notFound,
    total: senators.length,
    errors: errors.slice(0, 10),
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}

// app/api/sync-representatives/route.ts
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

async function fetchMembers(offset = 0, limit = 250) {
  const url = `${BASE_URL}/member?currentMember=true&limit=${limit}&offset=${offset}&format=json&api_key=${CONGRESS_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Congress.gov members API error: ${res.status} ${await res.text()}`);
  return res.json();
}

function normalizeParty(partyName: string, partyCode?: string): string {
  const name = (partyName || '').toLowerCase();
  if (name.includes('democrat')) return 'D';
  if (name.includes('republican')) return 'R';
  if (name.includes('independent')) return 'I';
  return partyCode || 'I';
}

function extractChamber(terms: any): string {
  const items = Array.isArray(terms?.item) ? terms.item : terms?.item ? [terms.item] : [];
  const last = items[items.length - 1];
  if (!last?.chamber) return 'House';
  return last.chamber.toLowerCase().includes('senate') ? 'Senate' : 'House';
}

function extractTermStart(terms: any): Date {
  const items = Array.isArray(terms?.item) ? terms.item : terms?.item ? [terms.item] : [];
  const last = items[items.length - 1];
  const year = last?.startYear || new Date().getFullYear();
  return new Date(`${year}-01-03`);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let totalSynced = 0;
  let offset = 0;
  const limit = 250;

  try {
    while (true) {
      const data = await fetchMembers(offset, limit);
      const members: any[] = data.members || [];

      if (members.length === 0) break;

      for (const member of members) {
        const bioguideId = member.bioguideId;
        if (!bioguideId) continue;

        // Congress.gov returns name as "LastName, FirstName" format
        const nameParts = (member.name || '').split(', ');
        const lastName = nameParts[0]?.trim() || '';
        const firstName = nameParts[1]?.trim() || '';
        const fullName = firstName ? `${firstName} ${lastName}` : lastName;

        const party = normalizeParty(member.partyName || '', member.party);
        const state = member.state || '';
        const district = member.district != null ? String(member.district) : null;
        const chamber = extractChamber(member.terms);
        const termStart = extractTermStart(member.terms);

        await prisma.representative.upsert({
          where: { bioguideId },
          create: {
            bioguideId,
            firstName,
            lastName,
            fullName,
            party,
            state,
            district,
            chamber,
            termStart,
            currentTerm: true,
            committees: [],
          },
          update: {
            firstName,
            lastName,
            fullName,
            party,
            state,
            district,
            chamber,
            currentTerm: true,
            updatedAt: new Date(),
          },
        });

        totalSynced++;
      }

      // Paginate
      if (members.length < limit) break;
      offset += limit;

      // Respect Congress.gov rate limit (5,000/hr = ~1.4/sec, be safe)
      await new Promise(r => setTimeout(r, 250));
    }

    return NextResponse.json({ success: true, synced: totalSynced });
  } catch (error) {
    console.error('[sync-representatives] error:', error);
    return NextResponse.json(
      { error: String(error), syncedSoFar: totalSynced },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing via browser
export async function GET(req: NextRequest) {
  return POST(req);
}

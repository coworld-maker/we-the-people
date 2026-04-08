// app/api/sync-congress-votes/route.ts
//
// REVISED APPROACH: Instead of scanning bill.actions for roll numbers (which are all null),
// we query Congress.gov's vote list API directly, then match bills back to our DB.
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

// Build a LIS member ID → bioguide ID lookup map for current senators.
// Senate.gov XML uses LIS IDs (e.g. "S399") but our DB stores bioguide IDs (e.g. "C001075").
// lisId is populated on the Representative table by sync-representatives.
async function buildSenatorLisMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await prisma.$queryRaw<{ bioguideId: string; lisId: string }[]>`
      SELECT "bioguideId", "lisId"
      FROM "Representative"
      WHERE chamber = 'Senate' AND "lisId" IS NOT NULL
    `;
    for (const row of rows) {
      map.set(row.lisId, row.bioguideId);
    }
  } catch (e) {
    console.error('[sync-congress-votes] Failed to build senator LIS map:', e);
  }
  return map;
}

// House: fetch paginated list of roll call votes for a congress/session
async function fetchHouseVoteList(congress: number, session: number, offset = 0) {
  const url = `${BASE_URL}/house-vote/${congress}/${session}?limit=250&offset=${offset}&format=json&api_key=${CONGRESS_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`House vote list ${congress}/${session} offset=${offset}: ${res.status}`);
  return res.json();
}

// House: fetch individual member votes for a roll call
async function fetchHouseMemberVotes(congress: number, session: number, rollNumber: number) {
  const url = `${BASE_URL}/house-vote/${congress}/${session}/${rollNumber}/members?format=json&api_key=${CONGRESS_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`House member votes roll=${rollNumber}: ${res.status}`);
  return res.json();
}

// Senate: fetch roll call vote list XML and parse it
async function fetchSenateVoteList(congress: number, session: number): Promise<any[]> {
  const url = `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${congress}_${session}.xml`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const xml = await res.text();
  // Parse vote entries: extract roll_number and document fields
  const entries: any[] = [];
  const voteRegex = /<vote>([\s\S]*?)<\/vote>/g;
  let match;
  while ((match = voteRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))?.[1]?.trim() || '';
    const rollNumber = parseInt(get('vote_number'));
    const docShort = get('document_short_title') || get('issue');
    const date = get('vote_date');
    entries.push({ rollNumber, docShort, date });
  }
  return entries;
}

// Senate: fetch member votes for a specific roll call
async function fetchSenateMemberVotes(congress: number, session: number, rollNumber: number) {
  const paddedRoll = String(rollNumber).padStart(5, '0');
  const url = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${paddedRoll}.xml`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Senate vote XML roll=${rollNumber}: ${res.status}`);
  return res.text();
}

function normalizePosition(raw: string): string | null {
  const s = (raw || '').toLowerCase().trim();
  if (s === 'yea' || s === 'yes' || s === 'aye') return 'yea';
  if (s === 'nay' || s === 'no') return 'nay';
  if (s === 'not voting' || s === 'absent' || s === 'not_voting') return 'not_voting';
  if (s === 'present') return 'present';
  return null;
}

function makeId(): string {
  return `cv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const congress = Number(body.congress ?? 119);
  const session = Number(body.session ?? 1);
  // maxVotes caps how many roll calls we process per invocation to stay within Vercel's 60s limit
  const maxVotes = Number(body.maxVotes ?? 50);
  const chamber = (body.chamber as string | undefined) ?? 'house'; // 'house' | 'senate' | 'both'

  let totalMemberVotesSynced = 0;
  let rollCallsMatched = 0;
  let rollCallsProcessed = 0;
  let rollCallsWithBillRef = 0;
  const errors: string[] = [];
  const debugSamples: any[] = [];

  try {
    if (chamber === 'house' || chamber === 'both') {
      let offset = 0;

      outerLoop:
      while (rollCallsProcessed < maxVotes) {
        const data = await fetchHouseVoteList(congress, session, offset);

        // Congress.gov response key is houseRollCallVotes
        const voteList: any[] = data.houseRollCallVotes ?? data.house_roll_call_votes ?? data.votes ?? [];

        if (voteList.length === 0) break;

        for (const vote of voteList) {
          if (rollCallsProcessed >= maxVotes) break outerLoop;

          const rollNumber: number = vote.rollNumber ?? vote.roll_number;
          const billRef = vote.bill ?? vote.amendment?.bill;

          rollCallsProcessed++;

          // Capture debug sample of first few votes to understand structure
          if (debugSamples.length < 3) {
            debugSamples.push({ rollNumber, keys: Object.keys(vote), billRef, voteType: vote.voteType ?? vote.type });
          }

          if (!rollNumber || !billRef) continue;
          rollCallsWithBillRef++;

          const billType = (billRef.type ?? billRef.billType ?? '').toUpperCase();
          const billNumber = String(billRef.number ?? billRef.billNumber ?? '');
          const billCongress = String(billRef.congress ?? congress);

          if (!billType || !billNumber) continue;

          // Look up this bill in our DB
          const bill = await prisma.bill.findFirst({
            where: { billType, billNumber, congress: billCongress },
            select: { id: true },
          });

          if (!bill) continue;
          rollCallsMatched++;

          // Fetch member votes for this roll call
          try {
            const memberData = await fetchHouseMemberVotes(congress, session, rollNumber);

            // Handle nested response shape from Congress.gov
            const raw =
              memberData?.houseRollCallVote?.members?.member ??
              memberData?.members?.member ??
              memberData?.members ??
              [];
            const members: any[] = Array.isArray(raw) ? raw : [raw];

            const voteDate = vote.date ? new Date(vote.date) : new Date();

            for (const member of members) {
              const bioguideId = member.bioguideId;
              const position = normalizePosition(member.votePosition ?? member.vote ?? '');
              if (!bioguideId || !position) continue;

              // Upsert — ON CONFLICT on the unique (bioguideId, billId) index
              await prisma.$executeRawUnsafe(
                `INSERT INTO "CongressVote"
                   (id, "bioguideId", "billId", position, chamber, "rollNumber", congress, session, "votedAt", "createdAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                 ON CONFLICT ("bioguideId", "billId")
                 DO UPDATE SET
                   position = EXCLUDED.position,
                   "rollNumber" = EXCLUDED."rollNumber",
                   "votedAt" = EXCLUDED."votedAt"`,
                makeId(),
                bioguideId,
                bill.id,
                position,
                'House',
                rollNumber,
                String(congress),
                session,
                voteDate
              );
              totalMemberVotesSynced++;
            }
          } catch (err) {
            const msg = `Roll ${rollNumber}: ${String(err)}`;
            errors.push(msg);
            console.error('[sync-congress-votes] House member fetch error:', msg);
          }

          await new Promise(r => setTimeout(r, 150)); // rate limit
        }

        if (voteList.length < 250) break;
        offset += 250;
      }
    }

    if (chamber === 'senate' || chamber === 'both') {
      // Pre-build LIS→bioguide map so we can translate senate.gov member IDs
      const lisMap = await buildSenatorLisMap();
      const senateVotes = await fetchSenateVoteList(congress, session);
      let senateProcessed = 0;

      for (const vote of senateVotes) {
        if (senateProcessed >= maxVotes) break;

        const { rollNumber, date } = vote;
        if (!rollNumber) continue;
        senateProcessed++;
        rollCallsProcessed++;

        try {
          const xml = await fetchSenateMemberVotes(congress, session, rollNumber);

          // Extract bill reference from XML
          const billTypeMatch = xml.match(/<document_type>(.*?)<\/document_type>/);
          const billNumMatch = xml.match(/<document_number>(.*?)<\/document_number>/);
          const billCongressMatch = xml.match(/<congress>(.*?)<\/congress>/);
          if (!billTypeMatch || !billNumMatch) continue;

          // Normalize senate.gov document_type to match our DB billType values
          // e.g. "S" → "S", "H.R." → "HR", "S.Res." → "SRES", "S.J.Res." → "SJRES"
          const rawType = (billTypeMatch[1] || '').trim().toUpperCase()
            .replace(/\./g, '')   // remove dots: "H.R." → "HR", "S.RES." → "SRES"
            .replace(/\s+/g, ''); // remove spaces
          // Map common variants
          const billTypeMap: Record<string, string> = {
            'HR': 'HR', 'HRES': 'HRES', 'HJRES': 'HJRES', 'HCONRES': 'HCONRES',
            'S': 'S', 'SRES': 'SRES', 'SJRES': 'SJRES', 'SCONRES': 'SCONRES',
            'SRES': 'SRES',
          };
          const billType = billTypeMap[rawType] ?? rawType;
          const billNumber = (billNumMatch[1] || '').trim();
          const billCongress = (billCongressMatch?.[1] || String(congress)).trim();

          if (!billType || !billNumber) continue;

          const bill = await prisma.bill.findFirst({
            where: { billType, billNumber, congress: billCongress },
            select: { id: true },
          });
          if (!bill) continue;
          rollCallsMatched++;

          // Parse member votes from XML
          const memberRegex = /<member>([\s\S]*?)<\/member>/g;
          let m;
          const voteDate = date ? new Date(date) : new Date();

          while ((m = memberRegex.exec(xml)) !== null) {
            const block = m[1];
            const get = (tag: string) => block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))?.[1]?.trim() || '';
            const rawId = get('lis_member_id') || get('bioguide_id');
            // Translate LIS ID (e.g. "S399") to bioguide ID (e.g. "C001075") using the map
            const bioguideId = rawId ? (lisMap.get(rawId) ?? rawId) : '';
            const position = normalizePosition(get('vote_cast'));
            if (!bioguideId || !position) continue;

            await prisma.$executeRawUnsafe(
              `INSERT INTO "CongressVote"
                 (id, "bioguideId", "billId", position, chamber, "rollNumber", congress, session, "votedAt", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
               ON CONFLICT ("bioguideId", "billId")
               DO UPDATE SET
                 position = EXCLUDED.position,
                 "rollNumber" = EXCLUDED."rollNumber",
                 "votedAt" = EXCLUDED."votedAt"`,
              makeId(),
              bioguideId,
              bill.id,
              position,
              'Senate',
              rollNumber,
              String(congress),
              session,
              voteDate
            );
            totalMemberVotesSynced++;
          }
        } catch (err) {
          errors.push(`Senate roll ${rollNumber}: ${String(err)}`);
        }

        await new Promise(r => setTimeout(r, 200));
      }
    }

    return NextResponse.json({
      success: true,
      synced: totalMemberVotesSynced,
      rollCallsMatched,
      rollCallsProcessed,
      rollCallsWithBillRef,
      debugSamples,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('[sync-congress-votes] fatal error:', error);
    return NextResponse.json(
      { error: String(error), synced: totalMemberVotesSynced },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

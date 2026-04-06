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

// House: fetch paginated list of roll call votes for a congress/session
async function fetchHouseVoteList(congress: number, session: number, offset = 0) {
  const url = `${BASE_URL}/house-vote/${congress}/${session}?limit=250&offset=${offset}&api_key=${CONGRESS_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`House vote list ${congress}/${session} offset=${offset}: ${res.status}`);
  return res.json();
}

// House: fetch individual member votes for a roll call
async function fetchHouseMemberVotes(congress: number, session: number, rollNumber: number) {
  const url = `${BASE_URL}/house-vote/${congress}/${session}/${rollNumber}/members?api_key=${CONGRESS_API_KEY}`;
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
  const errors: string[] = [];

  try {
    if (chamber === 'house' || chamber === 'both') {
      let offset = 0;

      outerLoop:
      while (rollCallsProcessed < maxVotes) {
        const data = await fetchHouseVoteList(congress, session, offset);

        // Congress.gov response key is houseRollCallVotes
        const voteList: any[] = data.houseRollCallVotes ?? data.votes ?? [];

        if (voteList.length === 0) break;

        for (const vote of voteList) {
          if (rollCallsProcessed >= maxVotes) break outerLoop;

          const rollNumber: number = vote.rollNumber ?? vote.roll_number;
          const billRef = vote.bill ?? vote.amendment?.bill;

          rollCallsProcessed++;

          if (!rollNumber || !billRef) continue;

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

          const billType = (billTypeMatch[1] || '').trim().toUpperCase()
            .replace('AMENDMENT', '')
            .replace('RESOLUTION', 'SRES')
            .trim();
          const billNumber = (billNumMatch[1] || '').trim();
          const billCongress = (billCongressMatch?.[1] || String(congress)).trim();

          const bill = await prisma.bill.findFirst({
            where: { billNumber, congress: billCongress },
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
            const bioguideId = get('lis_member_id') || get('bioguide_id');
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
      errors: errors.slice(0, 10), // cap error list
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

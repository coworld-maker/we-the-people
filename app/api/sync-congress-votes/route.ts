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

// US state full name → 2-letter abbreviation (matches Senate.gov XML format)
const STATE_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC', 'Puerto Rico': 'PR',
};

// Build a "LASTNAME_STATEABBR" → bioguide ID lookup map for current senators.
// Senate.gov vote XML includes last_name and 2-letter state for each member vote.
// Our DB stores full state names, so we convert them to abbreviations here.
async function buildSenatorNameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const senators = await prisma.representative.findMany({
      where: { chamber: 'Senate' },
      select: { bioguideId: true, lastName: true, state: true },
    });
    for (const s of senators) {
      if (s.lastName && s.state) {
        const stateAbbr = STATE_ABBR[s.state] ?? s.state.toUpperCase().slice(0, 2);
        map.set(`${s.lastName.toUpperCase()}_${stateAbbr}`, s.bioguideId);
      }
    }
  } catch (e) {
    console.error('[sync-congress-votes] Failed to build senator name map:', e);
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
    // Fix 2-digit year: senate.gov uses "M/D/YY" format (e.g. "12/10/25" for Dec 10 2025)
    const rawDate = get('vote_date');
    const mmddyy = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    const date = mmddyy
      ? `${mmddyy[1]}/${mmddyy[2]}/${parseInt(mmddyy[3]) < 50 ? 2000 + parseInt(mmddyy[3]) : 1900 + parseInt(mmddyy[3])}`
      : rawDate;
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
  let senatorMapDebug: { size: number; sampleKeys: string[] } | null = null;

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
      // Pre-build lastName_state→bioguideId map from our DB (single query)
      const senatorNameMap = await buildSenatorNameMap();
      // Debug: expose map size and a few sample keys in response
      senatorMapDebug = { size: senatorNameMap.size, sampleKeys: [...senatorNameMap.keys()].slice(0, 5) };
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
            // Match senator to bioguide ID via lastName+state lookup in our DB map
            const lastName = get('last_name').toUpperCase();
            const state = get('state').toUpperCase();
            const bioguideId = (lastName && state) ? (senatorNameMap.get(`${lastName}_${state}`) ?? '') : '';
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
      senatorMapDebug,
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

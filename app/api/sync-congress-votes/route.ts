// app/api/sync-congress-votes/route.ts
//
// REVISED APPROACH: Instead of scanning bill.actions for roll numbers (which are all null),
// we query Congress.gov's vote list API directly, then match bills back to our DB.
//
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSyncAuth } from '@/lib/auth/syncAuth';

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const BASE_URL = 'https://api.congress.gov/v3';

export const maxDuration = 300;

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

// House: fetch paginated list of roll call votes for a congress/session.
// IMPORTANT: explicitly sort by startDate desc — Congress.gov's default sort
// is by `updateDate` (when a record was last touched), which puts old roll
// calls with recent amendments ahead of genuinely recent votes. Without the
// explicit sort, this endpoint kept returning the same old rolls every run
// and never advanced past whatever we already had in the DB.
async function fetchHouseVoteList(congress: number, session: number, offset = 0) {
  const url = `${BASE_URL}/house-vote/${congress}/${session}?limit=250&offset=${offset}&sort=startDate+desc&format=json&api_key=${CONGRESS_API_KEY}`;
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

// Month abbreviation → 0-based index (matches senate.gov "DD-Mon" format, e.g. "18-Dec")
const MONTH_ABBR: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// The calendar year for a given congress session.
// The 1st Congress began in 1789; each congress covers 2 years.
// e.g. 119th Congress session 1 → 2025, session 2 → 2026
function congressSessionYear(congress: number, session: number): number {
  return 1789 + (congress - 1) * 2 + (session - 1);
}

// Senate: fetch roll call vote list XML and parse it
async function fetchSenateVoteList(congress: number, session: number): Promise<{ entries: any[]; sampleRawDates: string[] }> {
  const url = `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${congress}_${session}.xml`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return { entries: [], sampleRawDates: [] };
  const xml = await res.text();
  const year = congressSessionYear(congress, session);
  const entries: any[] = [];
  const sampleRawDates: string[] = [];
  const voteRegex = /<vote>([\s\S]*?)<\/vote>/g;
  let match;
  while ((match = voteRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))?.[1]?.trim() || '';
    const rollNumber = parseInt(get('vote_number'));
    const docShort = get('document_short_title') || get('issue');
    const rawDate = get('vote_date');
    if (sampleRawDates.length < 5) sampleRawDates.push(`roll${rollNumber}:${rawDate}`);

    // senate.gov vote_menu uses "DD-Mon" format with no year (e.g. "18-Dec").
    // We derive the year from congress/session: 119th session 1 → 2025.
    let date: string;
    const ddMon = rawDate.match(/^(\d{1,2})-([A-Za-z]{3})$/);
    if (ddMon) {
      const monthIdx = MONTH_ABBR[ddMon[2]];
      if (monthIdx !== undefined) {
        date = new Date(year, monthIdx, parseInt(ddMon[1])).toISOString();
      } else {
        date = rawDate;
      }
    } else {
      date = rawDate; // fallback for unexpected formats
    }
    entries.push({ rollNumber, docShort, date });
  }
  return { entries, sampleRawDates };
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
  if (!checkSyncAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const congress = Number(body.congress ?? 119);
  const session = Number(body.session ?? 1);
  // maxVotes caps how many roll calls we process per invocation to stay within Vercel's 60s limit
  const maxVotes = Number(body.maxVotes ?? 50);
  const chamber = (body.chamber as string | undefined) ?? 'house'; // 'house' | 'senate' | 'both'
  // senateOffset: skip the N most recent Senate roll calls before starting (for pagination)
  const senateOffset = Number(body.senateOffset ?? 0);

  let totalMemberVotesSynced = 0;
  let rollCallsMatched = 0;
  let rollCallsProcessed = 0;
  let rollCallsWithBillRef = 0;
  const errors: string[] = [];
  const debugSamples: any[] = [];
  let sampleRawDates: string[] = [];
  let memberDebug: any = null; // first member API response for House debugging
  let senatorMapDebug: { size: number; sampleKeys: string[] } | null = null;
  let highWaterMark = 0;

  try {
    if (chamber === 'house' || chamber === 'both') {
      // Skip roll calls we've already synced for this congress/session. Without
      // this guard the loop kept reprocessing the same handful of older rolls
      // every run, because Congress.gov's list endpoint doesn't reliably
      // return newest-first for the House vote API (sort=startDate desc had
      // no observable effect).
      const alreadySyncedRows = await prisma.congressVote.findMany({
        where: { congress: String(congress), session, chamber: 'House' },
        select: { rollNumber: true },
        distinct: ['rollNumber'],
      });
      const alreadySynced = new Set<number>(
        alreadySyncedRows.map(r => r.rollNumber).filter((n): n is number => n != null)
      );
      // High-water mark: the highest roll number we've ever stored for this
      // congress/session. Rolls at or below this number have already been
      // attempted (they just didn't match a bill in our DB), so skip them.
      // Without this, no-match rolls are re-processed on every run and the
      // loop never advances past them.
      const hwmRow = await prisma.congressVote.aggregate({
        where: { congress: String(congress), session, chamber: 'House' },
        _max: { rollNumber: true },
      });
      highWaterMark = hwmRow._max.rollNumber ?? 0;
      let skippedAsAlreadySynced = 0;

      let offset = 0;

      outerLoop:
      while (rollCallsProcessed < maxVotes) {
        // The pagination fetch can hit a dropped upstream connection
        // (undici "TypeError: terminated"). Treat that as a transient stop:
        // committed upserts are already saved, so break cleanly and return
        // 200 with partial progress instead of bubbling to a 500 that fails
        // the GitHub Actions job and discards the run.
        let data;
        try {
          data = await fetchHouseVoteList(congress, session, offset);
        } catch (e) {
          errors.push(`House list offset=${offset}: ${String(e)}`);
          break;
        }

        // Congress.gov response key is houseRollCallVotes
        const voteList: any[] = data.houseRollCallVotes ?? data.house_roll_call_votes ?? data.votes ?? [];

        if (voteList.length === 0) break;

        for (const vote of voteList) {
          if (rollCallsProcessed >= maxVotes) break outerLoop;

          // Skip roll calls we've already processed: either stored in our DB,
          // or below the high-water mark (tried before but no bill matched).
          const candidateRoll: number =
            vote.rollCallNumber ?? vote.rollNumber ?? vote.roll_number;
          if (candidateRoll && (alreadySynced.has(candidateRoll) || candidateRoll <= highWaterMark)) {
            skippedAsAlreadySynced++;
            continue;
          }

          // Congress.gov house-vote API uses rollCallNumber, legislationType, legislationNumber
          const rollNumber: number = vote.rollCallNumber ?? vote.rollNumber ?? vote.roll_number;
          // Try nested bill ref first, then top-level legislation fields
          const billRef = vote.bill ?? vote.amendment?.bill ?? null;
          const legType = (vote.legislationType ?? billRef?.type ?? billRef?.billType ?? '').trim().toUpperCase();
          const legNumber = String(vote.legislationNumber ?? billRef?.number ?? billRef?.billNumber ?? '').trim();

          rollCallsProcessed++;

          // Capture debug sample of first few votes to understand structure
          if (debugSamples.length < 3) {
            debugSamples.push({ rollNumber, keys: Object.keys(vote), legType, legNumber, voteType: vote.voteType ?? vote.type });
          }

          if (!rollNumber || !legType || !legNumber) continue;
          rollCallsWithBillRef++;

          const billType = legType;
          const billNumber = legNumber;
          const billCongress = String(vote.congress ?? congress);

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

            // Congress.gov house-vote members API shape:
            // { houseRollCallVoteMemberVotes: { results: [{ bioguideID, voteCast, ... }] } }
            const raw =
              memberData?.houseRollCallVoteMemberVotes?.results ??
              memberData?.houseRollCallVote?.members?.member ??
              memberData?.members?.member ??
              memberData?.members ??
              [];
            const members: any[] = Array.isArray(raw) ? raw : (raw ? [raw] : []);

            // Capture first member API response for debugging
            if (!memberDebug) {
              const firstMember = members[0] ?? null;
              memberDebug = {
                rollNumber,
                topLevelKeys: Object.keys(memberData ?? {}),
                membersFound: members.length,
                firstMemberKeys: firstMember ? Object.keys(firstMember) : [],
                firstMemberSample: firstMember ? {
                  bioguideID: firstMember.bioguideID,
                  bioguideId: firstMember.bioguideId,
                  voteCast: firstMember.voteCast,
                  votePosition: firstMember.votePosition,
                } : null,
              };
            }

            const voteDate = vote.startDate ? new Date(vote.startDate) : new Date();

            for (const member of members) {
              const bioguideId = member.bioguideID ?? member.bioguideId ?? member.bioGuideId;
              const position = normalizePosition(member.voteCast ?? member.votePosition ?? member.vote ?? '');
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

      // Skip roll calls we've already synced (same forward-progress guard as House)
      const alreadySyncedRows = await prisma.congressVote.findMany({
        where: { congress: String(congress), session, chamber: 'Senate' },
        select: { rollNumber: true },
        distinct: ['rollNumber'],
      });
      const alreadySynced = new Set<number>(
        alreadySyncedRows.map(r => r.rollNumber).filter((n): n is number => n != null)
      );

      // Same transient-stop guard as the House list fetch: a dropped
      // connection to senate.gov should yield partial 200, not a 500.
      let senateVotesAll: any[] = [];
      let rawDateSamples: string[] = [];
      try {
        ({ entries: senateVotesAll, sampleRawDates: rawDateSamples } = await fetchSenateVoteList(congress, session));
      } catch (e) {
        errors.push(`Senate list: ${String(e)}`);
      }
      // Apply offset to skip already-processed recent votes
      const senateVotes = senateVotesAll.slice(senateOffset);
      sampleRawDates = rawDateSamples;
      let senateProcessed = 0;

      for (const vote of senateVotes) {
        if (senateProcessed >= maxVotes) break;

        const { rollNumber, date } = vote;
        if (!rollNumber) continue;
        // Skip if we already have this roll number in the DB
        if (alreadySynced.has(rollNumber)) continue;
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
      highWaterMark,
      debugSamples,
      memberDebug,
      sampleRawDates,
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

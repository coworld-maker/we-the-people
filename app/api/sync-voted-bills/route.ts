// app/api/sync-voted-bills/route.ts
//
// Fetches bills referenced by House roll call votes that are missing from our DB.
// Run this before sync-congress-votes to ensure bill records exist.
// Supports pagination via `offset` and caps at `maxBills` per invocation (default 30).
//
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = 'https://api.congress.gov/v3';

function checkAuth(req: NextRequest): boolean {
  const secret = req.headers.get('x-sync-secret');
  const auth = req.headers.get('authorization');
  return secret === CRON_SECRET || auth === `Bearer ${CRON_SECRET}`;
}

function cuid(): string {
  return `bill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function fetchBillDetail(congress: number, billType: string, billNumber: string) {
  const type = billType.toLowerCase();
  const url = `${BASE_URL}/bill/${congress}/${type}/${billNumber}?format=json&api_key=${CONGRESS_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Bill fetch ${billType}${billNumber}: ${res.status}`);
  const data = await res.json();
  return data.bill ?? data;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const congress = Number(body.congress ?? 119);
  const session = Number(body.session ?? 1);
  const maxBills = Number(body.maxBills ?? 30);
  const offset = Number(body.offset ?? 0);

  let inserted = 0;
  let skipped = 0;
  let errors: string[] = [];
  const added: string[] = [];

  try {
    // Fetch the house vote list from Congress.gov
    const url = `${BASE_URL}/house-vote/${congress}/${session}?limit=250&offset=${offset}&format=json&api_key=${CONGRESS_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`House vote list: ${res.status}`);
    const data = await res.json();
    const voteList: any[] = data.houseRollCallVotes ?? data.house_roll_call_votes ?? [];

    for (const vote of voteList) {
      if (inserted >= maxBills) break;

      const legType = (vote.legislationType ?? '').trim().toUpperCase();
      const legNumber = String(vote.legislationNumber ?? '').trim();
      const billCongress = String(vote.congress ?? congress);

      if (!legType || !legNumber) continue;

      // Check if already in DB
      const existing = await prisma.bill.findFirst({
        where: { billType: legType, billNumber: legNumber, congress: billCongress },
        select: { id: true },
      });
      if (existing) { skipped++; continue; }

      // Fetch bill details from Congress.gov
      try {
        const bill = await fetchBillDetail(congress, legType, legNumber);

        const title = bill.title ?? bill.shortTitle ?? `${legType} ${legNumber}`;
        const introducedDate = bill.introducedDate
          ? new Date(bill.introducedDate)
          : new Date();
        const latestAction = bill.latestAction;
        const latestActionDate = latestAction?.actionDate
          ? new Date(latestAction.actionDate)
          : null;
        const latestActionText = latestAction?.text ?? null;
        const sponsors = bill.sponsors ?? [];
        const originChamber = bill.originChamber ?? (legType.startsWith('H') ? 'House' : 'Senate');
        const status = latestActionText ?? 'Introduced';
        const policyArea = bill.policyArea?.name ?? null;
        const subjects = bill.subjects?.legislativeSubjects?.map((s: any) => s.name) ?? [];

        await prisma.$executeRawUnsafe(
          `INSERT INTO "Bill"
             (id, congress, "billType", "billNumber", title, "introducedDate",
              "latestActionDate", "latestActionText", status, "originChamber",
              "policyArea", subjects, sponsors, "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
           ON CONFLICT (congress, "billType", "billNumber") DO NOTHING`,
          cuid(),
          billCongress,
          legType,
          legNumber,
          title,
          introducedDate,
          latestActionDate,
          latestActionText,
          status,
          originChamber,
          policyArea,
          subjects,
          JSON.stringify(sponsors),
        );

        inserted++;
        added.push(`${legType} ${legNumber}: ${title.slice(0, 60)}`);
        await new Promise(r => setTimeout(r, 200)); // rate limit
      } catch (err) {
        errors.push(`${legType} ${legNumber}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      added,
      errors: errors.slice(0, 10),
      nextOffset: offset + 250,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

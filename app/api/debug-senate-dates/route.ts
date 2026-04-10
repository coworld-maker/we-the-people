// app/api/debug-senate-dates/route.ts
// Temporary debug endpoint — delete after confirming the date format.
// Just open /api/debug-senate-dates in your browser.
import { NextResponse } from 'next/server';

export async function GET() {
  const url = 'https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_1.xml';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json({ error: `senate.gov returned ${res.status}` }, { status: 502 });
  }
  const xml = await res.text();

  // Pull first 5 raw <vote> blocks
  const rawBlocks: string[] = [];
  const voteRegex = /<vote>([\s\S]*?)<\/vote>/g;
  let match;
  while ((match = voteRegex.exec(xml)) !== null && rawBlocks.length < 5) {
    rawBlocks.push(match[1].trim());
  }

  // Also extract just the vote_date values
  const dates = rawBlocks.map(b => {
    const m = b.match(/<vote_date>(.*?)<\/vote_date>/);
    const n = b.match(/<vote_number>(.*?)<\/vote_number>/);
    return { roll: n?.[1] ?? '?', rawDate: m?.[1] ?? '(not found)' };
  });

  return NextResponse.json({ dates, rawBlocks });
}

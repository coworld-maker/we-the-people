import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { nameToAbbr } from '@/lib/utils/state-codes'

/**
 * Aggregated party makeup by state — powers the USPartyMap component.
 *
 * Returned shape:
 * {
 *   states: Record<stateCode, {
 *     house:  { D: number; R: number; I: number; total: number },
 *     senate: { D: number; R: number; I: number; total: number },
 *     houseShareD:  number  // 0–1, share of D in House delegation (for color ramp)
 *     senateShareD: number  // 0–1
 *   }>
 * }
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reps = await prisma.representative.findMany({
    where: { currentTerm: true },
    select: {
      bioguideId: true, fullName: true,
      state: true, district: true, chamber: true, party: true,
    },
  })

  // Normalize party to single letters (handles 'Democrat'/'D', 'Republican'/'R', 'Independent'/'I')
  function normParty(p: string): 'D' | 'R' | 'I' {
    const c = p?.charAt(0).toUpperCase()
    if (c === 'D') return 'D'
    if (c === 'R') return 'R'
    return 'I'
  }

  const states: Record<string, {
    house: { D: number; R: number; I: number; total: number }
    senate: { D: number; R: number; I: number; total: number }
    houseShareD: number
    senateShareD: number
  }> = {}

  for (const r of reps) {
    if (!r.state) continue
    // Representative.state is stored as full name ('California'); normalize to
    // the 2-letter code that the rest of the app (URLs, UI) uses.
    const stateCode = nameToAbbr(r.state)
    if (!stateCode) continue // skip unknown jurisdictions
    const party = normParty(r.party)
    const isSenate = (r.chamber || '').toLowerCase().includes('senate')
    const entry = states[stateCode] ?? {
      house: { D: 0, R: 0, I: 0, total: 0 },
      senate: { D: 0, R: 0, I: 0, total: 0 },
      houseShareD: 0, senateShareD: 0,
    }
    if (isSenate) {
      entry.senate[party]++
      entry.senate.total++
    } else {
      entry.house[party]++
      entry.house.total++
    }
    states[stateCode] = entry
  }

  // Compute D-shares for the color ramp (0 = solid R, 1 = solid D, 0.5 = split)
  for (const code of Object.keys(states)) {
    const s = states[code]
    s.houseShareD = s.house.total > 0 ? s.house.D / s.house.total : 0.5
    s.senateShareD = s.senate.total > 0 ? s.senate.D / s.senate.total : 0.5
  }

  return NextResponse.json({ states })
}

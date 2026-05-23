import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Single endpoint that powers both views of USPartyMap:
 *   - State view: aggregated delegation counts (House + Senate by party) per state
 *   - District view: one row per House district with the seated rep's party
 *
 * Returned shape:
 * {
 *   states: Record<stateCode, {
 *     house: { D: number; R: number; I: number; total: number },
 *     senate: { D: number; R: number; I: number; total: number },
 *     houseShareD: number  // 0–1, share of D in House delegation (for color ramp)
 *     senateShareD: number // 0–1
 *   }>,
 *   districts: Array<{
 *     state: string
 *     district: string           // '01', '02', … '00' for at-large
 *     party: 'D' | 'R' | 'I' | null
 *     bioguideId: string
 *     fullName: string
 *   }>,
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

  const districts: Array<{
    state: string; district: string;
    party: 'D' | 'R' | 'I'; bioguideId: string; fullName: string
  }> = []

  for (const r of reps) {
    if (!r.state) continue
    const party = normParty(r.party)
    const isSenate = (r.chamber || '').toLowerCase().includes('senate')
    const entry = states[r.state] ?? {
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
      districts.push({
        state: r.state,
        // Pad district to 2 digits matching Census/TIGER convention; '00' = at-large
        district: (r.district || '0').padStart(2, '0'),
        party,
        bioguideId: r.bioguideId,
        fullName: r.fullName,
      })
    }
    states[r.state] = entry
  }

  // Compute D-shares for the color ramp (0 = solid R, 1 = solid D, 0.5 = split)
  for (const code of Object.keys(states)) {
    const s = states[code]
    s.houseShareD = s.house.total > 0 ? s.house.D / s.house.total : 0.5
    s.senateShareD = s.senate.total > 0 ? s.senate.D / s.senate.total : 0.5
  }

  return NextResponse.json({ states, districts })
}

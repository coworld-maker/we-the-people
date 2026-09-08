// Public, lightweight zip -> representatives lookup for the landing-page hero.
// No auth: it returns only public roster facts (names, party, district) so a
// logged-out visitor can feel the product before signing up.
//
// A fifth of US ZIPs span more than one congressional district, and 109 span a
// state line, so a ZIP does not always identify one delegation. When it doesn't,
// this returns every candidate under `options` and sets `ambiguous`, leaving
// `house` and `district` null. See lib/data/zip-lookup.ts for the full account
// of why picking the first match was wrong.
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { lookupZip, type ZipMatch } from '@/lib/data/zip-lookup'
import { abbrToName } from '@/lib/utils/state-codes'

interface RepLite {
  fullName: string
  party: string
  bioguideId: string
  district: string | null
  chamber: string
}

const pub = ({ fullName, party, bioguideId }: RepLite) => ({ fullName, party, bioguideId })

/** House member for one state+district, or null when the roster has no match. */
function houseFor(reps: RepLite[], district: string): RepLite | null {
  const house = reps.filter(r => r.chamber === 'House')
  if (district === '0') return house[0] ?? null // at-large states have one member
  const want = district.replace(/^0+/, '')
  return house.find(r => String(r.district ?? '').replace(/^0+/, '') === want) ?? null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')?.trim()
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Enter a valid 5-digit ZIP code.' }, { status: 400 })
  }

  const found = lookupZip(zip)
  if (!found) {
    return NextResponse.json({ error: "We couldn't find that ZIP. Try a nearby one." }, { status: 404 })
  }

  // The ZIP dataset yields an ABBREVIATION ("GA") but Representative.state
  // stores the full name ("Georgia") — querying by the abbreviation silently
  // matched zero rows, so the hero's ZIP lookup returned no representatives.
  const stateNames = Array.from(
    new Set(found.matches.map(m => abbrToName(m.state) ?? m.state))
  )

  const roster = (await prisma.representative.findMany({
    where: { state: { in: stateNames }, currentTerm: true },
    select: { fullName: true, party: true, bioguideId: true, district: true, chamber: true, state: true },
  })) as (RepLite & { state: string })[]

  const forState = (abbr: string) => {
    const full = abbrToName(abbr) ?? abbr
    return roster.filter(r => r.state === full)
  }

  const build = (m: ZipMatch) => {
    const stateRoster = forState(m.state)
    const houseMember = houseFor(stateRoster, m.district)
    return {
      state: m.state,
      district: m.district,
      senators: stateRoster.filter(r => r.chamber === 'Senate').map(pub),
      house: houseMember
        ? { ...pub(houseMember), district: m.district }
        : null,
    }
  }

  const options = found.matches.map(build)

  if (!found.ambiguous) {
    const only = options[0]
    return NextResponse.json({
      zip,
      ambiguous: false,
      crossState: false,
      state: only.state,
      district: only.district,
      senators: only.senators,
      house: only.house,
      options,
    })
  }

  // Ambiguous: no single delegation is correct. `house`/`district` stay null so
  // a caller that ignores `ambiguous` shows nothing rather than the wrong member.
  return NextResponse.json({
    zip,
    ambiguous: true,
    crossState: found.crossState,
    state: null,
    district: null,
    // Senators are still safe to return when every match is in one state.
    senators: found.crossState ? [] : options[0].senators,
    house: null,
    options,
  })
}

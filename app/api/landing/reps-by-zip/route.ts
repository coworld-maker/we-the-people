// Public, lightweight zip -> representatives lookup for the landing-page hero.
// No auth: it returns only public roster facts (names, party, district) so a
// logged-out visitor can feel the product before signing up. Resolution uses
// the bundled static ZCTA->district dataset (same source as the in-app lookup).
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import zipDistricts from '@/lib/data/zip-districts.json'

interface RepLite {
  fullName: string
  party: string
  bioguideId: string
  district: string | null
  chamber: string
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')?.trim()
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Enter a valid 5-digit ZIP code.' }, { status: 400 })
  }

  const entry = (zipDistricts as Record<string, string>)[zip]
  if (!entry) {
    return NextResponse.json({ error: "We couldn't find that ZIP. Try a nearby one." }, { status: 404 })
  }

  // "GA-5"; at-large states use district "0".
  const [state, district] = entry.split('-')

  const reps = (await prisma.representative.findMany({
    where: { state, currentTerm: true },
    select: { fullName: true, party: true, bioguideId: true, district: true, chamber: true },
  })) as RepLite[]

  const senators = reps.filter(r => r.chamber === 'Senate')
  const houseReps = reps.filter(r => r.chamber === 'House')
  // At-large (district 0) states have a single House member; otherwise match it.
  const houseMember =
    district === '0'
      ? houseReps[0] ?? null
      : houseReps.find(r => String(r.district ?? '').replace(/^0+/, '') === district.replace(/^0+/, '')) ?? null

  return NextResponse.json({
    zip,
    state,
    district,
    senators: senators.map(({ fullName, party, bioguideId }) => ({ fullName, party, bioguideId })),
    house: houseMember
      ? { fullName: houseMember.fullName, party: houseMember.party, bioguideId: houseMember.bioguideId, district }
      : null,
  })
}

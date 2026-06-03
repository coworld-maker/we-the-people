import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')
  const districtFilter = searchParams.get('district') // optional — filters House members to specific district

  if (!state) return NextResponse.json({ error: 'State is required' }, { status: 400 })

  try {
    const representatives: any[] = []

    if (!CONGRESS_API_KEY) {
      return NextResponse.json({
        representatives: [],
        error: 'Congress API key not configured. Use the external links below to find your representatives.',
      })
    }

    const membersUrl = `https://api.congress.gov/v3/member/${state}?api_key=${CONGRESS_API_KEY}&currentMember=true&limit=50`

    const res = await fetch(membersUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 },
    })

    if (res.ok) {
      const data = await res.json()
      const members = data.members || []

      for (const member of members) {
        const latestTerm = member.terms?.item?.[0]
        const chamber = latestTerm?.chamber === 'Senate' ? 'Senate' : 'House'

        representatives.push({
          name: member.name || `${member.firstName} ${member.lastName}`,
          bioguideId: member.bioguideId || null,
          office: chamber === 'Senate'
            ? 'U.S. Senator'
            : `U.S. Representative${member.district ? ` — District ${member.district}` : ''}`,
          party: member.partyName === 'Republican' ? 'R'
            : member.partyName === 'Democratic' ? 'D'
            : member.partyName?.[0] || 'I',
          state: member.state || state,
          district: member.district ? String(member.district) : null,
          phone: null,
          website: member.officialWebsiteUrl || member.url || null,
          chamber,
          depiction: member.depiction?.imageUrl || null,
        })
      }
    } else {
      console.error('Congress API error:', res.status)
    }

    // If a district filter was provided, keep both senators + only the matching House member
    const filtered = districtFilter
      ? representatives.filter(r =>
          r.chamber === 'Senate' ||
          (r.chamber === 'House' && r.district === districtFilter)
        )
      : representatives

    filtered.sort((a, b) => {
      if (a.chamber === 'Senate' && b.chamber !== 'Senate') return -1
      if (a.chamber !== 'Senate' && b.chamber === 'Senate') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ representatives: filtered, totalHouseMembers: representatives.filter(r => r.chamber === 'House').length })
  } catch (error: any) {
    console.error('Representative lookup error:', error)
    return NextResponse.json({ error: 'Failed to look up representatives.' }, { status: 500 })
  }
}

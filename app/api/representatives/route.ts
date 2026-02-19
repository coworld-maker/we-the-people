import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')

  if (!state) return NextResponse.json({ error: 'State is required' }, { status: 400 })

  try {
    const representatives: any[] = []

    // Fetch current members from Congress.gov API
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (CONGRESS_API_KEY) {
      headers['X-Api-Key'] = CONGRESS_API_KEY
    }

    // Search for members by state
    const baseUrl = 'https://api.congress.gov/v3'
    const apiKey = CONGRESS_API_KEY ? `?api_key=${CONGRESS_API_KEY}` : ''

    // Get current congress number (118th: 2023-2025, 119th: 2025-2027)
    const currentCongress = 119

    // Fetch members for the state
    const membersUrl = `${baseUrl}/member/${state}${apiKey}&currentMember=true&limit=50`

    const res = await fetch(membersUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (res.ok) {
      const data = await res.json()
      const members = data.members || []

      for (const member of members) {
        // Determine chamber from terms
        const latestTerm = member.terms?.item?.[0]
        const chamber = latestTerm?.chamber === 'Senate' ? 'Senate' : 'House'

        representatives.push({
          name: member.name || `${member.firstName} ${member.lastName}`,
          office: chamber === 'Senate'
            ? `U.S. Senator`
            : `U.S. Representative${member.district ? ` — District ${member.district}` : ''}`,
          party: member.partyName === 'Republican' ? 'R'
            : member.partyName === 'Democratic' ? 'D'
            : member.partyName?.[0] || 'I',
          state: member.state || state,
          phone: member.directOrderName ? undefined : undefined, // API doesn't expose phone directly
          website: member.officialWebsiteUrl || member.url || null,
          chamber,
        })
      }
    } else {
      // Fallback: If Congress.gov API fails, return helpful external link
      console.error('Congress API error:', res.status, await res.text())
    }

    // Sort: Senators first, then House
    representatives.sort((a, b) => {
      if (a.chamber === 'Senate' && b.chamber !== 'Senate') return -1
      if (a.chamber !== 'Senate' && b.chamber === 'Senate') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ representatives })
  } catch (error: any) {
    console.error('Representative lookup error:', error)
    return NextResponse.json({ error: 'Failed to look up representatives. Please try the direct links below.' }, { status: 500 })
  }
}

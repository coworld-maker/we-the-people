import prisma from '@/lib/prisma'

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY
const BASE_URL = 'https://api.congress.gov/v3'

interface MemberVote {
  billId: string
  billType: string
  billNumber: string
  memberPosition: 'Yea' | 'Nay' | 'Not Voting' | 'Present' | string
}

interface AlignmentResult {
  memberName: string
  party: string
  chamber: string
  state: string
  alignmentPct: number
  matchedVotes: number
  totalOverlap: number
  details: Array<{
    billType: string
    billNumber: string
    billTitle: string
    userPosition: string
    memberPosition: string
    aligned: boolean
  }>
}

export class AlignmentService {
  /**
   * Calculate alignment between a user and a Congress member.
   * 
   * Flow:
   * 1. Get all bills the user has voted on
   * 2. For each bill, check if there's a recorded roll call vote in Congress
   * 3. Find how the specified member voted on those same bills
   * 4. Calculate overlap percentage
   */
  static async calculateAlignment(
    userId: string,
    memberBioguideId: string,
    memberName: string,
    memberParty: string,
    memberChamber: string,
    memberState: string
  ): Promise<AlignmentResult> {
    // Get user's votes with bill info
    const userVotes = await prisma.vote.findMany({
      where: { userId },
      include: {
        bill: {
          select: {
            id: true,
            title: true,
            shortTitle: true,
            billType: true,
            billNumber: true,
            congress: true,
            originChamber: true,
          },
        },
      },
    })

    if (userVotes.length === 0) {
      return {
        memberName, party: memberParty, chamber: memberChamber, state: memberState,
        alignmentPct: 0, matchedVotes: 0, totalOverlap: 0, details: [],
      }
    }

    const details: AlignmentResult['details'] = []
    let matches = 0
    let totalOverlap = 0

    // For each user vote, try to find the member's vote on the same bill
    for (const uv of userVotes) {
      if (!uv.bill) continue

      try {
        const memberPos = await this.getMemberVoteOnBill(
          uv.bill.congress,
          uv.bill.billType,
          uv.bill.billNumber,
          memberBioguideId,
          memberChamber
        )

        if (!memberPos) continue // No roll call vote found for this bill

        totalOverlap++

        // Compare positions
        const userYes = uv.position === 'yes'
        const userNo = uv.position === 'no'
        const memberYea = memberPos === 'Yea' || memberPos === 'Aye'
        const memberNay = memberPos === 'Nay' || memberPos === 'No'

        const aligned = (userYes && memberYea) || (userNo && memberNay)
        if (aligned) matches++

        details.push({
          billType: uv.bill.billType,
          billNumber: uv.bill.billNumber,
          billTitle: uv.bill.shortTitle || uv.bill.title,
          userPosition: uv.position,
          memberPosition: memberPos,
          aligned,
        })
      } catch (err) {
        console.error(`Error fetching vote for ${uv.bill.billType} ${uv.bill.billNumber}:`, err)
        continue
      }
    }

    const alignmentPct = totalOverlap > 0 ? Math.round((matches / totalOverlap) * 100) : 0

    return {
      memberName, party: memberParty, chamber: memberChamber, state: memberState,
      alignmentPct, matchedVotes: matches, totalOverlap, details,
    }
  }

  /**
   * Look up how a member voted on a specific bill via Congress.gov API.
   * Returns the member's position or null if no roll call vote found.
   */
  private static async getMemberVoteOnBill(
    congress: number,
    billType: string,
    billNumber: string,
    bioguideId: string,
    chamber: string
  ): Promise<string | null> {
    if (!CONGRESS_API_KEY) return null

    // Map bill type to API format
    const typeMap: Record<string, string> = {
      'HR': 'hr', 'S': 's', 'HRES': 'hres', 'SRES': 'sres',
      'HJRES': 'hjres', 'SJRES': 'sjres', 'HCONRES': 'hconres', 'SCONRES': 'sconres',
      'hr': 'hr', 's': 's',
    }
    const apiType = typeMap[billType] || billType.toLowerCase()

    try {
      // Get bill actions to find roll call vote numbers
      const actionsUrl = `${BASE_URL}/bill/${congress}/${apiType}/${billNumber}/actions?api_key=${CONGRESS_API_KEY}&limit=50`
      const actionsRes = await fetch(actionsUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 },
      })

      if (!actionsRes.ok) return null
      const actionsData = await actionsRes.json()
      const actions = actionsData.actions || []

      // Find roll call votes in actions
      for (const action of actions) {
        const rollCallRef = action.recordedVotes
        if (!rollCallRef || rollCallRef.length === 0) continue

        for (const rv of rollCallRef) {
          // rv should have: chamber, congress, date, rollNumber, sessionNumber, url
          const vChamber = rv.chamber === 'Senate' ? 'Senate' : 'House'

          // Get the actual roll call vote details
          const rollUrl = rv.url
          if (!rollUrl) continue

          const voteRes = await fetch(`${rollUrl}?api_key=${CONGRESS_API_KEY}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 86400 },
          })

          if (!voteRes.ok) continue
          const voteData = await voteRes.json()
          const vote = voteData.vote

          if (!vote?.positions) continue

          // Find the member's vote
          const memberVote = vote.positions.find(
            (p: any) => p.member_id === bioguideId || p.bioguide_id === bioguideId
          )

          if (memberVote) {
            return memberVote.vote_position || memberVote.position || null
          }
        }
      }

      return null
    } catch (err) {
      console.error('Vote lookup error:', err)
      return null
    }
  }

  /**
   * Get basic member info from Congress.gov by bioguide ID
   */
  static async getMemberInfo(bioguideId: string) {
    if (!CONGRESS_API_KEY) return null

    try {
      const url = `${BASE_URL}/member/${bioguideId}?api_key=${CONGRESS_API_KEY}`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 },
      })

      if (!res.ok) return null
      const data = await res.json()
      return data.member || null
    } catch {
      return null
    }
  }
}

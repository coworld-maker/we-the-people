// lib/congress-votes.ts
// Fetches how Congress members voted on bills via Congress.gov API
// House votes: Congress.gov House Roll Call API (118th Congress / 2023+)
// Senate votes: Senate Clerk XML feed

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY
const CONGRESS_BASE = 'https://api.congress.gov/v3'

export interface MemberVote {
  bioguideId: string
  firstName: string
  lastName: string
  party: string
  state: string
  position: 'yea' | 'nay' | 'not_voting' | 'present'
}

export interface RollCallVoteRef {
  rollNumber: number
  congress: number
  session: number
  chamber: 'house' | 'senate'
  date: string | null
  clerkRollNumber?: number // senate only
}

// -----------------------------------------------------------------------
// Step 1: Get roll call vote references from a bill's actions
// -----------------------------------------------------------------------
export async function getBillRollCallRefs(
  congress: string,
  billType: string,
  billNumber: string
): Promise<RollCallVoteRef[]> {
  const url = `${CONGRESS_BASE}/bill/${congress}/${billType.toLowerCase()}/${billNumber}/actions?limit=250&api_key=${CONGRESS_API_KEY}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Congress API error: ${res.status} for bill actions`)

  const data = await res.json()
  const actions = data.actions ?? []

  const refs: RollCallVoteRef[] = []

  for (const action of actions) {
    if (!action.recordedVotes?.length) continue
    for (const rv of action.recordedVotes) {
      const chamber = rv.chamber?.toLowerCase()
      if (chamber !== 'house' && chamber !== 'senate') continue
      refs.push({
        rollNumber: rv.rollNumber,
        congress: rv.congress ?? parseInt(congress),
        session: rv.sessionNumber ?? 1,
        chamber: chamber as 'house' | 'senate',
        date: action.actionDate ?? null,
      })
    }
  }

  return refs
}

// -----------------------------------------------------------------------
// Step 2a: Fetch House member votes via Congress.gov Roll Call API
// -----------------------------------------------------------------------
export async function getHouseMemberVotes(
  congress: number,
  session: number,
  rollNumber: number
): Promise<MemberVote[]> {
  const url = `${CONGRESS_BASE}/house-vote/${congress}/${session}/${rollNumber}/members?limit=250&api_key=${CONGRESS_API_KEY}`

  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`House vote fetch failed: ${res.status} for roll ${rollNumber}`)
    return []
  }

  const data = await res.json()
  const members = data.members ?? []

  return members.map((m: any) => ({
    bioguideId: m.bioguideId ?? m.member?.bioguideId,
    firstName: m.firstName ?? m.member?.firstName ?? '',
    lastName: m.lastName ?? m.member?.lastName ?? '',
    party: m.party ?? m.member?.party ?? '',
    state: m.state ?? m.member?.state ?? '',
    position: normalizeHousePosition(m.votePosition ?? m.vote),
  })).filter((m: MemberVote) => m.bioguideId)
}

// -----------------------------------------------------------------------
// Step 2b: Fetch Senate member votes via Senate Clerk XML
// Senate XML feed: https://www.senate.gov/legislative/LIS/roll_call_votes/
// -----------------------------------------------------------------------
export async function getSenateMemberVotes(
  congress: number,
  session: number,
  rollNumber: number
): Promise<MemberVote[]> {
  const paddedRoll = String(rollNumber).padStart(5, '0')
  const url = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${paddedRoll}.xml`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`Senate vote XML fetch failed: ${res.status}`)
      return []
    }
    const xml = await res.text()
    return parseSenateMemberVotesXml(xml)
  } catch (err) {
    console.warn('Senate vote fetch error:', err)
    return []
  }
}

function parseSenateMemberVotesXml(xml: string): MemberVote[] {
  const members: MemberVote[] = []
  // Simple regex-based XML parsing (no DOM in edge runtime)
  const memberMatches = xml.matchAll(/<member>([\s\S]*?)<\/member>/g)
  for (const match of memberMatches) {
    const block = match[1]
    const bioguideId = extractXml(block, 'lis_member_id') ?? extractXml(block, 'bioguide_id')
    const firstName = extractXml(block, 'first_name') ?? ''
    const lastName = extractXml(block, 'last_name') ?? ''
    const party = extractXml(block, 'party') ?? ''
    const state = extractXml(block, 'state') ?? ''
    const voteRaw = extractXml(block, 'vote_cast') ?? ''

    if (!bioguideId) continue

    members.push({
      bioguideId,
      firstName,
      lastName,
      party,
      state,
      position: normalizeSenatePosition(voteRaw),
    })
  }
  return members
}

function extractXml(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match ? match[1].trim() : null
}

// -----------------------------------------------------------------------
// Position normalizers
// -----------------------------------------------------------------------
function normalizeHousePosition(raw: string | undefined): MemberVote['position'] {
  if (!raw) return 'not_voting'
  const v = raw.toLowerCase()
  if (v === 'yea' || v === 'aye' || v === 'yes') return 'yea'
  if (v === 'nay' || v === 'no') return 'nay'
  if (v === 'present') return 'present'
  return 'not_voting'
}

function normalizeSenatePosition(raw: string | undefined): MemberVote['position'] {
  if (!raw) return 'not_voting'
  const v = raw.toLowerCase()
  if (v === 'yea' || v === 'aye') return 'yea'
  if (v === 'nay' || v === 'no') return 'nay'
  if (v === 'present') return 'present'
  return 'not_voting'
}

// -----------------------------------------------------------------------
// Unified: fetch all member votes for a bill's roll call refs
// -----------------------------------------------------------------------
export async function fetchAllMemberVotesForBill(
  congress: string,
  billType: string,
  billNumber: string
): Promise<{ ref: RollCallVoteRef; members: MemberVote[] }[]> {
  const refs = await getBillRollCallRefs(congress, billType, billNumber)
  if (!refs.length) return []

  // Take the final passage vote if multiple exist (last roll call)
  // Multiple roll calls can exist (amendments, procedural) — we want the final one
  const finalRef = refs[refs.length - 1]

  const members =
    finalRef.chamber === 'house'
      ? await getHouseMemberVotes(finalRef.congress, finalRef.session, finalRef.rollNumber)
      : await getSenateMemberVotes(finalRef.congress, finalRef.session, finalRef.rollNumber)

  return [{ ref: finalRef, members }]
}

/**
 * Pure helpers for the landing hero's "latest votes on bills" list
 * (GET /api/landing/rep-votes). No DB access here — unit-tested directly.
 */
import { latestPerMemberBill, normalizeMemberPosition, type MemberPosition } from '@/lib/data/voteKinds'

export const BIOGUIDE_ID = /^[A-Z]\d{6}$/
export const MAX_IDS = 6
export const VOTES_PER_MEMBER = 3

const BILL_CODE_PREFIX: Record<string, string> = {
  HR: 'H.R.', S: 'S.', HRES: 'H.Res.', SRES: 'S.Res.',
  HJRES: 'H.J.Res.', SJRES: 'S.J.Res.', HCONRES: 'H.Con.Res.', SCONRES: 'S.Con.Res.',
}

/** "HR" + "3633" → "H.R. 3633". Unknown types fall back to the raw type. */
export function formatBillCode(billType: string | null | undefined, billNumber: string | number | null | undefined): string {
  const t = (billType ?? '').replace(/[.\s]/g, '').toUpperCase()
  const prefix = BILL_CODE_PREFIX[t] ?? (billType ?? '').trim()
  const n = String(billNumber ?? '').trim()
  return [prefix, n].filter(Boolean).join(' ')
}

/** Calendar year of a session: the 1st Congress's 1st session was 1789. */
export function sessionYear(congress: number, session: number): number {
  return 1789 + (congress - 1) * 2 + (session - 1)
}

/** Official roll-call record, or null when the row lacks what the URL needs. */
export function rollCallUrl(v: {
  chamber: string | null | undefined
  congress: string | number | null | undefined
  session: number | null | undefined
  rollNumber: number | null | undefined
}): string | null {
  const congress = Number(v.congress)
  const { session, rollNumber } = v
  if (!Number.isInteger(congress) || congress < 1 || !session || !rollNumber) return null
  const chamber = (v.chamber ?? '').toLowerCase()
  if (chamber === 'house') {
    return `https://clerk.house.gov/Votes/${sessionYear(congress, session)}${rollNumber}`
  }
  if (chamber === 'senate') {
    const roll = String(rollNumber).padStart(5, '0')
    return `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${roll}.htm`
  }
  return null
}

export function parseIds(raw: string | null | undefined): string[] | null {
  const ids = Array.from(new Set((raw ?? '').split(',').map(s => s.trim()).filter(Boolean)))
  if (ids.length < 1 || ids.length > MAX_IDS) return null
  return ids.every(id => BIOGUIDE_ID.test(id)) ? ids : null
}

export interface VoteRow {
  bioguideId: string
  billId: string
  position: string
  votedAt: Date | null
  chamber: string | null
  rollNumber: number | null
  congress: string | null
  session: number | null
  question: string | null
  bill: { billType: string; billNumber: string; title: string | null; shortTitle: string | null } | null
}

export interface RepVote {
  billId: string
  code: string
  title: string
  position: MemberPosition | null
  question: string | null
  votedAt: string | null
  sourceUrl: string | null
}

/**
 * Rows must already be passage-only (ON_THE_BILL). Keeps each member's latest
 * roll call per bill, then that member's `limit` newest. Every requested id
 * gets a key; a member with nothing gets [] (shown as "no recorded votes").
 */
export function pickLatestVotes(ids: string[], rows: VoteRow[], limit = VOTES_PER_MEMBER): Record<string, RepVote[]> {
  const out: Record<string, RepVote[]> = Object.fromEntries(ids.map(id => [id, [] as RepVote[]]))
  const latest = latestPerMemberBill(rows.filter(r => r.bioguideId in out))
    .sort((a, b) => (b.votedAt?.getTime() ?? 0) - (a.votedAt?.getTime() ?? 0))
  for (const r of latest) {
    const list = out[r.bioguideId]
    if (list.length >= limit) continue
    list.push({
      billId: r.billId,
      code: r.bill ? formatBillCode(r.bill.billType, r.bill.billNumber) : '',
      title: r.bill?.shortTitle || r.bill?.title || '',
      position: normalizeMemberPosition(r.position),
      question: r.question,
      votedAt: r.votedAt ? r.votedAt.toISOString() : null,
      sourceUrl: rollCallUrl(r),
    })
  }
  return out
}

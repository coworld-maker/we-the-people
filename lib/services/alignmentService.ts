import prisma from '@/lib/prisma'
import { ON_THE_BILL, latestPerMemberBill } from '@/lib/data/voteKinds'
import { tallyAgreement } from '@/lib/data/agreement'

interface AlignmentResult {
  memberName: string
  party: string
  chamber: string
  state: string
  /** null = no shared votes yet. Render as "not enough data", never 0%. */
  alignmentPct: number | null
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
   * Agreement between a user and one member of Congress, from stored roll
   * calls (`CongressVote`) — votes on the bill itself only, latest per bill.
   *
   * This used to ask Congress.gov live for every bill the user had voted on
   * (a request per bill plus one per roll call, needing CONGRESS_API_KEY) and
   * took the first roll call it found, which was often procedural (cloture,
   * recommit) rather than the vote on the bill. It also reported 0% for a user
   * with no shared votes. It now uses the same data and rules as
   * calculateDelegationAlignment, and `alignmentPct` is null when nothing
   * overlaps.
   */
  static async calculateAlignment(
    userId: string,
    memberBioguideId: string,
    memberName: string,
    memberParty: string,
    memberChamber: string,
    memberState: string
  ): Promise<AlignmentResult> {
    const base = { memberName, party: memberParty, chamber: memberChamber, state: memberState }
    const empty: AlignmentResult = { ...base, alignmentPct: null, matchedVotes: 0, totalOverlap: 0, details: [] }

    const userVotes = await prisma.vote.findMany({
      where: { userId, position: { in: ['yes', 'no'] } },
      select: {
        billId: true,
        position: true,
        bill: { select: { title: true, shortTitle: true, billType: true, billNumber: true } },
      },
    })
    if (userVotes.length === 0) return empty

    const memberVotes = latestPerMemberBill(await prisma.congressVote.findMany({
      where: {
        bioguideId: memberBioguideId,
        billId: { in: userVotes.map(v => v.billId) },
        ...ON_THE_BILL,
      },
      select: { billId: true, bioguideId: true, position: true, votedAt: true },
    }))

    const { pct, matched, overlap, compared } = tallyAgreement(
      new Map(userVotes.map(v => [v.billId, v.position])),
      memberVotes,
    )
    const billById = new Map(userVotes.map(v => [v.billId, v.bill]))

    return {
      ...base,
      alignmentPct: pct,
      matchedVotes: matched,
      totalOverlap: overlap,
      details: compared.map(({ vote, userPosition, aligned }) => {
        const bill = billById.get(vote.billId)
        return {
          billType: bill?.billType ?? '',
          billNumber: bill?.billNumber ?? '',
          billTitle: bill?.shortTitle || bill?.title || '',
          userPosition,
          memberPosition: vote.position,
          aligned,
        }
      }),
    }
  }

  /**
   * Aggregate agreement between a user and their state's congressional
   * delegation, computed entirely from local data (`CongressVote`) — no
   * Congress.gov call, so it is cheap enough for a dashboard render.
   *
   * Returns `pct: null` when there is no overlap, and callers MUST render that
   * as "not enough data" rather than 0%. A user who has never voted has
   * UNDEFINED agreement, not zero agreement. This repo has already shipped that
   * bug once, in lib/api/lda.ts, where a failed lookup stored as 0 was
   * indistinguishable from a genuine "no lobbying found".
   *
   * Replaces a placeholder on the dashboard that was
   * `totalVotes / (totalVotes + 5)` — a curve over the user's own vote count
   * with no second party in it at all, captioned "Voting Alignment".
   *
   * Scope note: `User.state` is the only geography stored (no district), so
   * this covers the whole state delegation — both senators and every House
   * member from the state — not "your representative". Label it as such.
   */
  static async calculateDelegationAlignment(
    userId: string,
    state: string | null,
  ): Promise<{ pct: number | null; matched: number; overlap: number; memberCount: number }> {
    const empty = { pct: null, matched: 0, overlap: 0, memberCount: 0 }
    if (!state) return empty

    const [userVotes, members] = await Promise.all([
      prisma.vote.findMany({
        where: { userId, position: { in: ['yes', 'no'] } },
        select: { billId: true, position: true },
      }),
      prisma.representative.findMany({
        where: { state, currentTerm: true },
        select: { bioguideId: true },
      }),
    ])
    if (userVotes.length === 0 || members.length === 0) return empty

    // Votes on the bill itself only (not cloture/recommit), latest per member per bill.
    const memberVotes = latestPerMemberBill(await prisma.congressVote.findMany({
      where: {
        billId: { in: userVotes.map(v => v.billId) },
        bioguideId: { in: members.map(m => m.bioguideId) },
        ...ON_THE_BILL,
      },
      select: { billId: true, bioguideId: true, position: true, votedAt: true },
    }))
    if (memberVotes.length === 0) return { ...empty, memberCount: members.length }

    // Same rules as calculateAlignment (lib/data/agreement.ts): abstentions,
    // "Present" and "Not Voting" are excluded from both sides rather than
    // counted as disagreement.
    const { pct, matched, overlap } = tallyAgreement(
      new Map(userVotes.map(v => [v.billId, v.position])),
      memberVotes,
    )
    return { pct, matched, overlap, memberCount: members.length }
  }
}

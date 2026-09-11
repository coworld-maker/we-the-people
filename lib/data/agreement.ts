import { agrees } from './voteKinds'

/**
 * Agreement between one person's votes and members' votes on the same bills.
 * Shared by the rep cards and the delegation card so the rules can't drift:
 * - only yes/no from the user and yea/nay from the member count (agrees());
 *   abstain, Present and Not Voting are left out rather than scored as a miss;
 * - pct is null when nothing overlaps — undefined agreement, never 0%.
 * Callers pass member votes already limited to votes on the bill itself
 * (ON_THE_BILL) and to the latest per member per bill (latestPerMemberBill).
 */

export interface MemberBillVote {
  billId: string
  position: string
}

export interface Agreement<T> {
  pct: number | null
  matched: number
  overlap: number
  compared: Array<{ vote: T; userPosition: string; aligned: boolean }>
}

export function tallyAgreement<T extends MemberBillVote>(
  userPositionByBill: Map<string, string>,
  memberVotes: T[],
): Agreement<T> {
  let matched = 0
  const compared: Agreement<T>['compared'] = []
  for (const vote of memberVotes) {
    const userPosition = userPositionByBill.get(vote.billId)
    if (!userPosition) continue
    const same = agrees(userPosition, vote.position)
    if (same === null) continue
    if (same) matched++
    compared.push({ vote, userPosition, aligned: same })
  }
  const overlap = compared.length
  return { pct: overlap > 0 ? Math.round((matched / overlap) * 100) : null, matched, overlap, compared }
}

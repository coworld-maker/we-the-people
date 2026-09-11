import { describe, it, expect } from 'vitest'
import {
  classifyVote, voteKindLabel, normalizeMemberPosition, normalizeUserPosition,
  agrees, latestPerMemberBill, parseLegisNum, isBillType,
} from '@/lib/data/voteKinds'

// Stored values as of 2026-09-11: CongressVote.position is lowercase
// ('yea','nay','not_voting','present'); Vote.position is 'yes'|'no'|'abstain'.
// Several callers compared 'Yea' or 'yes' === 'yea' and silently never matched.
describe('position comparison', () => {
  it('normalises member positions as actually stored', () => {
    expect(normalizeMemberPosition('yea')).toBe('yea')
    expect(normalizeMemberPosition('Yea')).toBe('yea')
    expect(normalizeMemberPosition('Aye')).toBe('yea')
    expect(normalizeMemberPosition('nay')).toBe('nay')
    expect(normalizeMemberPosition('not_voting')).toBe('not_voting')
    expect(normalizeMemberPosition('Not Voting')).toBe('not_voting')
    expect(normalizeMemberPosition('')).toBeNull()
  })

  it('normalises user positions', () => {
    expect(normalizeUserPosition('yes')).toBe('yes')
    expect(normalizeUserPosition('no')).toBe('no')
    expect(normalizeUserPosition('abstain')).toBeNull()
  })

  it('agrees() matches a user "yes" with a stored "yea" — the case that used to fail', () => {
    expect(agrees('yes', 'yea')).toBe(true)
    expect(agrees('no', 'nay')).toBe(true)
    expect(agrees('yes', 'nay')).toBe(false)
    expect(agrees('no', 'yea')).toBe(false)
  })

  it('agrees() returns null (not a disagreement) when either side took no position', () => {
    expect(agrees('abstain', 'yea')).toBeNull()
    expect(agrees('yes', 'not_voting')).toBeNull()
    expect(agrees('yes', 'present')).toBeNull()
  })
})

describe('parseLegisNum / isBillType', () => {
  it('reads House Clerk <legis-num> values into our bill keys', () => {
    expect(parseLegisNum('H R 1048')).toEqual({ billType: 'HR', billNumber: '1048' })
    expect(parseLegisNum('H RES 566')).toEqual({ billType: 'HRES', billNumber: '566' })
    expect(parseLegisNum('H J RES 105')).toEqual({ billType: 'HJRES', billNumber: '105' })
    expect(parseLegisNum('S 5')).toEqual({ billType: 'S', billNumber: '5' })
  })

  it('returns null for things that are not bills', () => {
    expect(parseLegisNum('QUORUM')).toBeNull()
    expect(parseLegisNum('H AMDT 12')).toBeNull()
    expect(parseLegisNum('')).toBeNull()
    expect(parseLegisNum(null)).toBeNull()
  })

  it('isBillType accepts bill types and rejects amendments', () => {
    expect(isBillType('HR')).toBe(true)
    expect(isBillType('S.J.Res.')).toBe(true)
    expect(isBillType('HAMDT')).toBe(false)
    expect(isBillType('')).toBe(false)
  })
})

describe('latestPerMemberBill', () => {
  it("keeps each member's latest vote per bill", () => {
    const d = (s: string) => new Date(s)
    const rows = [
      { bioguideId: 'A', billId: 'b1', votedAt: d('2026-01-01'), position: 'yea' },
      { bioguideId: 'A', billId: 'b1', votedAt: d('2026-03-01'), position: 'nay' },
      { bioguideId: 'B', billId: 'b1', votedAt: d('2026-01-01'), position: 'yea' },
      { bioguideId: 'A', billId: 'b2', votedAt: null, position: 'yea' },
    ]
    const out = latestPerMemberBill(rows)
    expect(out).toHaveLength(3)
    expect(out.find(r => r.bioguideId === 'A' && r.billId === 'b1')!.position).toBe('nay')
  })
})

// Question strings are real ones from the House Clerk and senate.gov records
// behind the roll calls stored as of 2026-09-11.
describe('classifyVote', () => {
  it('treats passage-type questions as votes on the bill', () => {
    expect(classifyVote('On Passage', 'Protect Economic and Academic Freedom Act')).toBe('passage')
    expect(classifyVote('On Motion to Suspend the Rules and Pass, as Amended', 'Some Act')).toBe('passage')
    expect(classifyVote('On Passage of the Bill', 'A bill to …')).toBe('passage')
    expect(classifyVote('On the Joint Resolution', 'Providing for congressional disapproval …')).toBe('passage')
  })

  it('treats cloture, motions and previous-question votes as procedural', () => {
    expect(classifyVote('On Cloture on the Motion to Proceed', 'A bill to amend the Help America Vote Act')).toBe('procedural')
    expect(classifyVote('On the Motion to Proceed', 'Any bill')).toBe('procedural')
    expect(classifyVote('On Ordering the Previous Question', 'Providing for consideration of the bill (H.R. 1501)')).toBe('procedural')
    expect(classifyVote('On Motion to Recommit', 'Any bill')).toBe('procedural')
    expect(classifyVote('On Motion to Table', 'Censuring Representative …')).toBe('procedural')
  })

  it('treats adopting a House rule as procedural even though it is "agreeing to the resolution"', () => {
    expect(classifyVote('On Agreeing to the Resolution', 'Providing for consideration of the bill (H.R. 4795) to …')).toBe('procedural')
    expect(classifyVote('On Agreeing to the Resolution', 'Waiving a requirement of clause 6(a) of rule XIII …')).toBe('procedural')
    // …but a substantive resolution is a vote on that resolution
    expect(classifyVote('On Agreeing to the Resolution', 'Reaffirming Iran remains the largest state sponsor of terrorism.')).toBe('passage')
  })

  it('leaves an unknown question unclassified instead of guessing', () => {
    expect(classifyVote(null, 'Any bill')).toBeNull()
    expect(classifyVote('', 'Any bill')).toBeNull()
  })

  it('labels kinds in plain English', () => {
    expect(voteKindLabel('passage')).toBe('Vote on the bill')
    expect(voteKindLabel('procedural')).toBe('Procedural vote')
    expect(voteKindLabel(null)).toBe('Vote type unknown')
  })
})

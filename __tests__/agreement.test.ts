import { describe, it, expect } from 'vitest'
import { tallyAgreement } from '../lib/data/agreement'

const user = new Map([['b1', 'yes'], ['b2', 'no'], ['b3', 'yes'], ['b4', 'abstain']])

describe('tallyAgreement', () => {
  it('returns null, not 0, when nothing overlaps', () => {
    expect(tallyAgreement(new Map(), [{ billId: 'b1', position: 'yea' }]).pct).toBeNull()
    expect(tallyAgreement(user, []).pct).toBeNull()
    expect(tallyAgreement(user, [{ billId: 'zz', position: 'yea' }]).pct).toBeNull()
  })

  it('counts yes/yea and no/nay as agreement', () => {
    const r = tallyAgreement(user, [
      { billId: 'b1', position: 'yea' },  // agree
      { billId: 'b2', position: 'yea' },  // disagree
      { billId: 'b3', position: 'yea' },  // agree
    ])
    expect(r).toMatchObject({ matched: 2, overlap: 3, pct: 67 })
    expect(r.compared.map(c => c.aligned)).toEqual([true, false, true])
  })

  it('leaves out Not Voting, Present and the user abstaining', () => {
    const r = tallyAgreement(user, [
      { billId: 'b1', position: 'not_voting' },
      { billId: 'b3', position: 'present' },
      { billId: 'b4', position: 'yea' },
      { billId: 'b2', position: 'nay' },
    ])
    expect(r).toMatchObject({ matched: 1, overlap: 1, pct: 100 })
  })

  it('reports 0% only when there is overlap and no agreement', () => {
    const r = tallyAgreement(user, [{ billId: 'b1', position: 'nay' }])
    expect(r).toMatchObject({ matched: 0, overlap: 1, pct: 0 })
  })
})

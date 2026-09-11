import { describe, it, expect } from 'vitest'
import { formatBillCode, rollCallUrl, sessionYear, parseIds, pickLatestVotes, type VoteRow } from '@/lib/data/repVotes'

const bill = (billType: string, billNumber: string, shortTitle: string | null = null) =>
  ({ billType, billNumber, title: `Full title of ${billType} ${billNumber}`, shortTitle })

const row = (o: Partial<VoteRow>): VoteRow => ({
  bioguideId: 'A000001', billId: 'b1', position: 'yea', votedAt: new Date('2025-03-01'),
  chamber: 'House', rollNumber: 42, congress: '119', session: 1, question: 'On Passage',
  bill: bill('HR', '1'), ...o,
})

describe('formatBillCode', () => {
  it('maps every stored bill type', () => {
    expect(formatBillCode('HR', '3633')).toBe('H.R. 3633')
    expect(formatBillCode('S', '5')).toBe('S. 5')
    expect(formatBillCode('HRES', '1')).toBe('H.Res. 1')
    expect(formatBillCode('SRES', '1')).toBe('S.Res. 1')
    expect(formatBillCode('HJRES', '1')).toBe('H.J.Res. 1')
    expect(formatBillCode('SJRES', '1')).toBe('S.J.Res. 1')
    expect(formatBillCode('HCONRES', '1')).toBe('H.Con.Res. 1')
    expect(formatBillCode('SCONRES', '1')).toBe('S.Con.Res. 1')
  })
})

describe('rollCallUrl', () => {
  it('computes the session year', () => {
    expect(sessionYear(119, 1)).toBe(2025)
    expect(sessionYear(119, 2)).toBe(2026)
    expect(sessionYear(118, 2)).toBe(2024)
  })
  it('builds the House Clerk URL', () => {
    expect(rollCallUrl({ chamber: 'House', congress: '119', session: 2, rollNumber: 7 }))
      .toBe('https://clerk.house.gov/Votes/20267')
    expect(rollCallUrl({ chamber: 'House', congress: '119', session: 1, rollNumber: 190 }))
      .toBe('https://clerk.house.gov/Votes/2025190')
  })
  it('builds the senate.gov URL with a 5-digit roll number', () => {
    expect(rollCallUrl({ chamber: 'Senate', congress: '119', session: 1, rollNumber: 42 }))
      .toBe('https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00042.htm')
  })
  it('returns null when a needed field is missing', () => {
    expect(rollCallUrl({ chamber: 'House', congress: '119', session: null, rollNumber: 3 })).toBeNull()
    expect(rollCallUrl({ chamber: null, congress: '119', session: 1, rollNumber: 3 })).toBeNull()
  })
})

describe('parseIds', () => {
  it('accepts 1–6 valid ids and rejects the rest', () => {
    expect(parseIds('A000001,B000002')).toEqual(['A000001', 'B000002'])
    expect(parseIds('')).toBeNull()
    expect(parseIds('a000001')).toBeNull()
    expect(parseIds('A000001,X')).toBeNull()
    expect(parseIds('A000001,A000002,A000003,A000004,A000005,A000006,A000007')).toBeNull()
  })
})

describe('pickLatestVotes', () => {
  it('keeps the latest roll call per bill, newest first, top 3', () => {
    const rows = [
      row({ billId: 'b1', votedAt: new Date('2025-01-01'), position: 'nay' }),
      row({ billId: 'b1', votedAt: new Date('2025-06-01'), position: 'yea', question: 'On Motion to Concur in the Senate Amendment' }),
      row({ billId: 'b2', votedAt: new Date('2025-05-01'), bill: bill('S', '9', 'Short') }),
      row({ billId: 'b3', votedAt: new Date('2025-04-01'), position: 'not_voting' }),
      row({ billId: 'b4', votedAt: new Date('2025-02-01') }),
    ]
    const out = pickLatestVotes(['A000001'], rows)['A000001']
    expect(out.map(v => v.billId)).toEqual(['b1', 'b2', 'b3'])
    expect(out[0].position).toBe('yea')
    expect(out[0].question).toBe('On Motion to Concur in the Senate Amendment')
    expect(out[1]).toMatchObject({ code: 'S. 9', title: 'Short' })
    expect(out[2].position).toBe('not_voting')
    expect(out[0].sourceUrl).toBe('https://clerk.house.gov/Votes/202542')
  })
  it('gives members with no passage votes an empty array', () => {
    const out = pickLatestVotes(['A000001', 'B000002'], [row({})])
    expect(out['B000002']).toEqual([])
    expect(out['A000001']).toHaveLength(1)
  })
  it('keeps members separate', () => {
    const out = pickLatestVotes(['A000001', 'B000002'], [
      row({ billId: 'b1' }), row({ bioguideId: 'B000002', billId: 'b1', position: 'nay' }),
    ])
    expect(out['A000001'][0].position).toBe('yea')
    expect(out['B000002'][0].position).toBe('nay')
  })
})

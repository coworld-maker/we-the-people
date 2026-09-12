import { describe, it, expect } from 'vitest'
import { displayName, partyCode, summarizeRace, formatRaised, dedupeCampaigns, type FecElectionCandidate } from '../lib/data/senateRaces'

const row = (name: string, party: string, status: string | null, raised: number, date = '2026-06-30T00:00:00'): FecElectionCandidate => ({
  candidate_id: name, candidate_name: name, party_full: party, incumbent_challenge_full: status,
  total_receipts: raised, coverage_end_date: date,
})

describe('displayName', () => {
  it('turns FEC "LAST, FIRST" into a readable name', () => {
    expect(displayName('OSSOFF, T. JONATHAN')).toBe('T. Jonathan Ossoff')
    expect(displayName('COLLINS, MICHAEL A JR')).toBe('Michael A Collins Jr.')
    expect(displayName('DUBLIN, MICHAEL LOUIS JR.')).toBe('Michael Louis Dublin Jr.')
    expect(displayName('BLACKWOLF, MICHAEL JAMES MR.')).toBe('Michael James Blackwolf')
    expect(displayName('CORNYN, JOHN SEN')).toBe('John Cornyn')
    expect(displayName('PAXTON, WARREN KENNETH JR.')).toBe('Warren Kenneth Paxton Jr.')
    expect(displayName('EL-SAYED, ABDUL')).toBe('Abdul El-Sayed')
    expect(displayName('MCMORROW, MALLORY')).toBe('Mallory McMorrow')
    expect(displayName("O'ROURKE, BETO")).toBe("Beto O'Rourke")
  })
})

describe('partyCode', () => {
  it('maps FEC party names', () => {
    expect(partyCode('DEMOCRATIC PARTY')).toBe('D')
    expect(partyCode('REPUBLICAN PARTY')).toBe('R')
    expect(partyCode('INDEPENDENT')).toBe('I')
    expect(partyCode('LIBERTARIAN PARTY')).toBe('L')
    expect(partyCode('GREEN PARTY')).toBe('G')
    expect(partyCode(null)).toBe('O')
  })
})

describe('summarizeRace', () => {
  it('flags an open seat and keeps the top fundraisers above the floor', () => {
    const nc = summarizeRace('NC', [
      row('NICKEL, WILEY', 'DEMOCRATIC PARTY', 'Open seat', 2_972_089),
      row('COOPER, ROY', 'DEMOCRATIC PARTY', 'Open seat', 34_975_789),
      row('WHATLEY, MICHAEL', 'REPUBLICAN PARTY', 'Open seat', 11_272_504),
      row('MORROW, MICHELE', 'REPUBLICAN PARTY', 'Open seat', 13_014),
    ])
    expect(nc.openSeat).toBe(true)
    expect(nc.candidates.map(c => c.name)).toEqual(['Roy Cooper', 'Michael Whatley', 'Wiley Nickel'])
    expect(nc.filedCount).toBe(4)
  })

  it('always keeps the incumbent, even below the floor', () => {
    const r = summarizeRace('XX', [
      row('A, BIG', 'REPUBLICAN PARTY', 'Challenger', 9_000_000),
      row('B, BIG', 'REPUBLICAN PARTY', 'Challenger', 8_000_000),
      row('C, BIG', 'DEMOCRATIC PARTY', 'Challenger', 7_000_000),
      row('D, BIG', 'DEMOCRATIC PARTY', 'Challenger', 6_000_000),
      row('SITTING, SENATOR', 'DEMOCRATIC PARTY', 'Incumbent', 50_000),
    ])
    expect(r.openSeat).toBe(false)
    expect(r.candidates).toHaveLength(4)
    expect(r.candidates.some(c => c.incumbent && c.name === 'Senator Sitting')).toBe(true)
  })

  it('reports the latest reporting date as asOf', () => {
    const r = summarizeRace('FL', [
      row('MOODY, ASHLEY', 'REPUBLICAN PARTY', 'Incumbent', 11_270_805, '2026-07-29T00:00:00'),
      row('WEIL, JOSHUA JOSEPH', 'DEMOCRATIC PARTY', 'Challenger', 15_933_478, '2025-09-30T00:00:00'),
    ])
    expect(r.asOf).toBe('2026-07-29')
  })

  it('never reports a future date as asOf', () => {
    const r = summarizeRace('XX', [
      row('A, BIG', 'REPUBLICAN PARTY', 'Incumbent', 9_000_000, '2026-09-30T00:00:00'),
      row('B, BIG', 'DEMOCRATIC PARTY', 'Challenger', 8_000_000, '2026-06-30T00:00:00'),
    ], { today: '2026-09-12' })
    expect(r.asOf).toBe('2026-06-30')
    const allFuture = summarizeRace('XX', [row('A, BIG', 'REPUBLICAN PARTY', 'Incumbent', 1, '2026-12-31')], { today: '2026-09-12' })
    expect(allFuture.asOf).toBeNull()
  })
})

describe('dedupeCampaigns', () => {
  const chew = (name: string, id: string, extra: Partial<FecElectionCandidate> = {}): FecElectionCandidate => ({
    candidate_id: id, candidate_name: name, party_full: 'OTHER', incumbent_challenge_full: 'Challenger',
    total_receipts: 1_300_000, coverage_end_date: '2026-06-30', ...extra,
  })

  it('merges two records that share a principal campaign committee', () => {
    const rows = dedupeCampaigns([
      chew('CHEW, ROBERT', 'S1', { candidate_pcc_id: 'C001' }),
      chew('CHEW, BOB', 'S2', { candidate_pcc_id: 'C001', total_receipts: 1_250_000 }),
    ])
    expect(rows).toHaveLength(1)
  })

  it('without committee ids, merges same last name + party + identical total', () => {
    expect(dedupeCampaigns([chew('CHEW, ROBERT', 'S1'), chew('CHEW, BOB', 'S2')])).toHaveLength(1)
  })

  it('keeps different people who share a last name', () => {
    const rows = dedupeCampaigns([
      chew('SMITH, ANN', 'S1', { total_receipts: 500_000 }),
      chew('SMITH, JOE', 'S2', { total_receipts: 90_000 }),
    ])
    expect(rows).toHaveLength(2)
  })

  it('keeps the record with the latest report', () => {
    const rows = dedupeCampaigns([
      chew('CHEW, BOB', 'OLD', { coverage_end_date: '2026-03-31' }),
      chew('CHEW, ROBERT', 'NEW', { coverage_end_date: '2026-06-30' }),
    ])
    expect(rows.map(r => r.candidate_id)).toEqual(['NEW'])
  })

  it('summarizeRace shows one Chew, not two', () => {
    const co = summarizeRace('CO', [
      row('HICKENLOOPER, JOHN W.', 'DEMOCRATIC PARTY', 'Incumbent', 10_300_000),
      chew('CHEW, ROBERT', 'S1'),
      chew('CHEW, BOB', 'S2'),
      row('GONZALES, JULIE', 'DEMOCRATIC PARTY', 'Challenger', 979_000),
    ])
    expect(co.candidates.filter(c => c.name.endsWith('Chew'))).toHaveLength(1)
    expect(co.filedCount).toBe(3)
  })
})

describe('formatRaised', () => {
  it('abbreviates dollars', () => {
    expect(formatRaised(97_986_263)).toBe('$98.0M')
    expect(formatRaised(563_078)).toBe('$563K')
    expect(formatRaised(950)).toBe('$950')
  })
})

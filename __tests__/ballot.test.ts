import { describe, it, expect } from 'vitest'
import { buildStateBallot, ballotSummary, daysUntilElection, ELECTION_DAY } from '../lib/data/ballot'
import { governorRaceFor, KEY_GOV_RACES_2026 } from '../lib/data/governorRaces'
import type { SenateRace } from '../lib/data/senateRaces'

const senate: SenateRace = {
  state: 'GA',
  openSeat: false,
  candidates: [{ id: 'C1', name: 'A Candidate', party: 'D', incumbent: true, raised: 1_000_000 }],
  filedCount: 9,
  asOf: '2026-09-30',
}

describe('daysUntilElection', () => {
  it('counts whole days to November 3', () => {
    expect(daysUntilElection(new Date('2026-11-02T23:00:00Z'))).toBe(1)
    expect(daysUntilElection(new Date('2026-10-14T12:00:00Z'))).toBe(20)
  })

  it('counts on the Eastern calendar, not UTC', () => {
    // 10pm Eastern on Oct 28 is already Oct 29 in UTC
    expect(daysUntilElection(new Date('2026-10-29T02:00:00Z'))).toBe(6)
  })

  it('is 0 on the day and after it, never negative', () => {
    expect(daysUntilElection(new Date(`${ELECTION_DAY}T08:00:00Z`))).toBe(0)
    expect(daysUntilElection(new Date('2026-12-01T00:00:00Z'))).toBe(0)
  })
})

describe('buildStateBallot', () => {
  it('marks a statewide race when the FEC shows one', () => {
    const b = buildStateBallot({ code: 'ga', name: 'Georgia', houseSeats: 14, senate, governor: governorRaceFor('GA') })
    expect(b.code).toBe('GA')
    expect(b.hasStatewideRace).toBe(true)
    expect(b.governor?.ratings.cook).toBe('Toss-up')
  })

  it('handles a state with House seats only', () => {
    const b = buildStateBallot({ code: 'WA', name: 'Washington', houseSeats: 10, senate: null, governor: null })
    expect(b.hasStatewideRace).toBe(false)
    expect(b.senate).toBeUndefined()
  })

  it('never reports negative seats', () => {
    expect(buildStateBallot({ code: 'DC', name: 'District of Columbia', houseSeats: -1 }).houseSeats).toBe(0)
  })
})

describe('ballotSummary', () => {
  it('lists the offices plainly, without predictions', () => {
    const ga = buildStateBallot({ code: 'GA', name: 'Georgia', houseSeats: 14, senate, governor: governorRaceFor('GA') })
    expect(ballotSummary(ga)).toBe(
      'Georgia votes on all 14 U.S. House seats, a U.S. Senate seat and the governor’s office on November 3, 2026.',
    )
  })

  it('uses the singular for a one-seat state', () => {
    const wy = buildStateBallot({ code: 'WY', name: 'Wyoming', houseSeats: 1 })
    expect(ballotSummary(wy)).toBe('Wyoming votes on 1 U.S. House seat on November 3, 2026.')
  })

  it('falls back when a state elects nothing federal', () => {
    expect(ballotSummary(buildStateBallot({ code: 'DC', name: 'District of Columbia', houseSeats: 0 }))).toContain(
      'Federal elections in District of Columbia',
    )
  })
})

describe('governorRaceFor', () => {
  it('finds a rated race regardless of case, and nothing for unrated states', () => {
    expect(governorRaceFor('ia')?.ratings.cook).toBe('Lean D')
    expect(governorRaceFor('WA')).toBeUndefined()
  })

  it('lists exactly one Democrat and one Republican in every race', () => {
    for (const race of KEY_GOV_RACES_2026) {
      expect(race.candidates.map(c => c.party).sort()).toEqual(['D', 'R'])
    }
  })
})

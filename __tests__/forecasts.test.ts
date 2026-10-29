import { describe, it, expect } from 'vitest'
import {
  RATINGS, SENATE_RATINGS_2026, competitiveness, raceRatings, ratingDistance, senateRatingsFor,
} from '../lib/data/forecasts'
import { KEY_GOV_RACES_2026 } from '../lib/data/governorRaces'

// Each outlet's own vocabulary — a row using another outlet's word is a typo.
const VOCAB = {
  cook: ['Solid D', 'Likely D', 'Lean D', 'Toss-up', 'Lean R', 'Likely R', 'Solid R'],
  sabato: ['Safe D', 'Likely D', 'Lean D', 'Toss-up', 'Lean R', 'Likely R', 'Safe R'],
  inside: ['Solid D', 'Likely D', 'Lean D', 'Tilt D', 'Toss-up', 'Tilt R', 'Lean R', 'Likely R', 'Solid R'],
}

const allRows = [
  ...Object.values(SENATE_RATINGS_2026),
  ...KEY_GOV_RACES_2026.map(r => r.ratings),
]

describe('forecast data', () => {
  it('has all 35 Senate races', () => {
    expect(Object.keys(SENATE_RATINGS_2026)).toHaveLength(35)
  })

  it('uses each outlet’s own rating words', () => {
    for (const row of allRows) {
      expect(VOCAB.cook).toContain(row.cook)
      expect(VOCAB.sabato).toContain(row.sabato)
      expect(VOCAB.inside).toContain(row.inside)
    }
  })

  it('looks up Senate ratings regardless of case', () => {
    expect(senateRatingsFor('me')?.cook).toBe('Toss-up')
    expect(senateRatingsFor('WA')).toBeUndefined()
  })
})

describe('competitiveness', () => {
  it('scores distance from Toss-up for every rating', () => {
    expect(ratingDistance('Toss-up')).toBe(0)
    expect(ratingDistance('Tilt R')).toBe(1)
    expect(ratingDistance('Lean D')).toBe(2)
    expect(ratingDistance('Likely R')).toBe(3)
    expect(ratingDistance('Safe D')).toBe(4)
    for (const rating of RATINGS) expect(ratingDistance(rating)).toBeLessThanOrEqual(4)
  })

  it('is symmetric between parties', () => {
    expect(competitiveness(raceRatings('Lean D', 'Lean D', 'Tilt D')))
      .toBe(competitiveness(raceRatings('Lean R', 'Lean R', 'Tilt R')))
  })

  it('orders the governor list closest first', () => {
    const scores = KEY_GOV_RACES_2026.map(r => competitiveness(r.ratings))
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
    expect(KEY_GOV_RACES_2026[0].state).toBe('GA')
  })
})

/**
 * Race ratings from three independent forecasters, shown side by side so no
 * single outlet's call stands alone. Entered by hand — none of them offers a
 * free feed — and every label is the outlet's own word: Cook and Inside
 * Elections say "Solid", Sabato says "Safe", and only Inside Elections uses
 * "Tilt". Don't translate one into another.
 *
 * Checked 2026-10-28, each against the outlet's own page where it loads:
 *   Cook       cookpolitical.com ratings pages (governor Oct 27, Senate Oct 20)
 *   Inside     insideelections.com's ratings JSON export (both Oct 15)
 *   Sabato     centerforpolitics.org blocks automated access, so read from
 *              270toWin's Crystal Ball maps (both Oct 27) and cross-checked
 *              against the Crystal Ball's Oct 22 and Oct 27 change articles.
 * Update a row and FORECASTS_CHECKED together; the per-outlet dates below are
 * the outlets' own last-update dates and change only when they publish.
 */

export const FORECASTS_CHECKED = 'Oct 28, 2026'

export type ForecasterKey = 'cook' | 'sabato' | 'inside'

export interface Forecaster {
  key: ForecasterKey
  name: string
  short: string
  /** The outlet's own last update, per office. */
  asOf: { governor: string; senate: string }
}

export const FORECASTERS: Forecaster[] = [
  { key: 'cook', name: 'Cook Political Report', short: 'Cook', asOf: { governor: 'Oct 27', senate: 'Oct 20' } },
  { key: 'sabato', name: 'Sabato’s Crystal Ball', short: 'Sabato', asOf: { governor: 'Oct 27', senate: 'Oct 27' } },
  { key: 'inside', name: 'Inside Elections', short: 'Inside Elections', asOf: { governor: 'Oct 15', senate: 'Oct 15' } },
]

export const RATINGS = [
  'Solid D', 'Safe D', 'Likely D', 'Lean D', 'Tilt D', 'Toss-up',
  'Tilt R', 'Lean R', 'Likely R', 'Safe R', 'Solid R',
] as const
export type Rating = (typeof RATINGS)[number]

export type RaceRatings = Record<ForecasterKey, Rating>

/** Positional so a data row reads like the table it was copied from: Cook, Sabato, Inside. */
export function raceRatings(cook: Rating, sabato: Rating, inside: Rating): RaceRatings {
  return { cook, sabato, inside }
}

/** How far a rating sits from Toss-up: 0 (Toss-up) to 4 (Solid/Safe). */
export function ratingDistance(rating: Rating): number {
  if (rating === 'Toss-up') return 0
  if (rating.startsWith('Tilt')) return 1
  if (rating.startsWith('Lean')) return 2
  if (rating.startsWith('Likely')) return 3
  return 4
}

/**
 * Lower is closer. Summed across all three outlets so ordering a list by it
 * never privileges one forecaster's view of the race.
 */
export function competitiveness(ratings: RaceRatings): number {
  return ratingDistance(ratings.cook) + ratingDistance(ratings.sabato) + ratingDistance(ratings.inside)
}

const r = raceRatings

/** All 35 Senate races on the 2026 ballot (Ohio and Florida are the specials). */
export const SENATE_RATINGS_2026: Record<string, RaceRatings> = {
  AK: r('Toss-up', 'Lean D', 'Toss-up'),
  AL: r('Solid R', 'Safe R', 'Solid R'),
  AR: r('Solid R', 'Safe R', 'Solid R'),
  CO: r('Solid D', 'Safe D', 'Solid D'),
  DE: r('Solid D', 'Safe D', 'Solid D'),
  FL: r('Solid R', 'Likely R', 'Likely R'),
  GA: r('Likely D', 'Likely D', 'Lean D'),
  IA: r('Toss-up', 'Toss-up', 'Tilt R'),
  ID: r('Solid R', 'Safe R', 'Solid R'),
  IL: r('Solid D', 'Safe D', 'Solid D'),
  KS: r('Toss-up', 'Toss-up', 'Tilt R'),
  KY: r('Solid R', 'Safe R', 'Solid R'),
  LA: r('Solid R', 'Safe R', 'Solid R'),
  MA: r('Solid D', 'Safe D', 'Solid D'),
  ME: r('Toss-up', 'Toss-up', 'Toss-up'),
  MI: r('Toss-up', 'Lean D', 'Tilt D'),
  MN: r('Lean D', 'Lean D', 'Lean D'),
  MS: r('Likely R', 'Likely R', 'Solid R'),
  MT: r('Solid R', 'Safe R', 'Solid R'),
  NC: r('Likely D', 'Likely D', 'Lean D'),
  NE: r('Likely R', 'Lean R', 'Lean R'),
  NH: r('Lean D', 'Likely D', 'Tilt D'),
  NJ: r('Solid D', 'Safe D', 'Solid D'),
  NM: r('Solid D', 'Safe D', 'Solid D'),
  OH: r('Toss-up', 'Toss-up', 'Toss-up'),
  OK: r('Solid R', 'Safe R', 'Solid R'),
  OR: r('Solid D', 'Safe D', 'Solid D'),
  RI: r('Solid D', 'Safe D', 'Solid D'),
  SC: r('Lean R', 'Lean R', 'Lean R'),
  SD: r('Solid R', 'Safe R', 'Solid R'),
  TN: r('Solid R', 'Safe R', 'Solid R'),
  TX: r('Toss-up', 'Toss-up', 'Toss-up'),
  VA: r('Solid D', 'Safe D', 'Solid D'),
  WV: r('Solid R', 'Safe R', 'Solid R'),
  WY: r('Solid R', 'Safe R', 'Solid R'),
}

export function senateRatingsFor(stateCode: string): RaceRatings | undefined {
  return SENATE_RATINGS_2026[stateCode.toUpperCase()]
}

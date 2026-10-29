/**
 * The most-watched 2026 governor races: nominees plus three forecasters'
 * ratings (see lib/data/forecasts.ts for sources and dates). The FEC doesn't
 * cover state offices, so everything here is entered by hand.
 *
 * Checked 2026-10-28. Cook's Oct 27 update moved Ohio Toss-up -> Lean D (the
 * move this file previously held back as unconfirmed) and Kansas Lean R ->
 * Toss-up; both are now confirmed on cookpolitical.com itself.
 *
 * Candidates are the Democratic and Republican nominees, matched across
 * Wikipedia's 2026 gubernatorial table and whatsonmyballot.info. Listed by
 * surname so neither party is always first. Third-party and independent
 * candidates are on several of these ballots too (Mike Duggan withdrew in
 * Michigan), so the UI must not present these as the full field.
 */

import { competitiveness, raceRatings as r, type RaceRatings } from '@/lib/data/forecasts'

export interface GovernorCandidate {
  name: string
  party: 'R' | 'D'
}

export interface GovernorRace {
  state: string
  name: string
  incumbent: string
  party: 'R' | 'D' | 'I'
  /** Cook, Sabato, Inside Elections — in that order in each row below. */
  ratings: RaceRatings
  notes: string
  candidates: GovernorCandidate[]
}

const D = (name: string): GovernorCandidate => ({ name, party: 'D' })
const R = (name: string): GovernorCandidate => ({ name, party: 'R' })

const RACES: GovernorRace[] = [
  { state: 'GA', name: 'Georgia', incumbent: 'Brian Kemp', party: 'R', ratings: r('Toss-up', 'Toss-up', 'Toss-up'), notes: 'Kemp term-limited; open race', candidates: [D('Keisha Lance Bottoms'), R('Rick Jackson')] },
  { state: 'NV', name: 'Nevada', incumbent: 'Joe Lombardo', party: 'R', ratings: r('Toss-up', 'Toss-up', 'Tilt R'), notes: 'Lombardo seeking a second term', candidates: [D('Aaron Ford'), R('Joe Lombardo')] },
  { state: 'OH', name: 'Ohio', incumbent: 'Mike DeWine', party: 'R', ratings: r('Lean D', 'Lean D', 'Toss-up'), notes: 'DeWine term-limited; open race', candidates: [D('Amy Acton'), R('Vivek Ramaswamy')] },
  { state: 'WI', name: 'Wisconsin', incumbent: 'Tony Evers', party: 'D', ratings: r('Toss-up', 'Lean D', 'Toss-up'), notes: 'Evers retiring; open race', candidates: [D('David Crowley'), R('Tom Tiffany')] },
  { state: 'IA', name: 'Iowa', incumbent: 'Kim Reynolds', party: 'R', ratings: r('Lean D', 'Lean D', 'Tilt D'), notes: 'Reynolds not seeking a third term; open race', candidates: [R('Zach Lahn'), D('Rob Sand')] },
  { state: 'AZ', name: 'Arizona', incumbent: 'Katie Hobbs', party: 'D', ratings: r('Lean D', 'Likely D', 'Tilt D'), notes: 'Hobbs seeking a second term', candidates: [R('Andy Biggs'), D('Katie Hobbs')] },
  { state: 'MI', name: 'Michigan', incumbent: 'Gretchen Whitmer', party: 'D', ratings: r('Lean D', 'Likely D', 'Tilt D'), notes: 'Whitmer term-limited; open race', candidates: [D('Jocelyn Benson'), R('John James')] },
  { state: 'KS', name: 'Kansas', incumbent: 'Laura Kelly', party: 'D', ratings: r('Toss-up', 'Lean R', 'Tilt R'), notes: 'Kelly term-limited; open race', candidates: [D('Cindy Holscher'), R('Ty Masterson')] },
  { state: 'TX', name: 'Texas', incumbent: 'Greg Abbott', party: 'R', ratings: r('Lean R', 'Lean R', 'Lean R'), notes: 'Abbott seeking re-election', candidates: [R('Greg Abbott'), D('Gina Hinojosa')] },
  { state: 'FL', name: 'Florida', incumbent: 'Ron DeSantis', party: 'R', ratings: r('Lean R', 'Lean R', 'Lean R'), notes: 'DeSantis term-limited; open race', candidates: [R('Byron Donalds'), D('David Jolly')] },
  { state: 'NY', name: 'New York', incumbent: 'Kathy Hochul', party: 'D', ratings: r('Solid D', 'Safe D', 'Likely D'), notes: 'Hochul seeking re-election', candidates: [R('Bruce Blakeman'), D('Kathy Hochul')] },
  { state: 'PA', name: 'Pennsylvania', incumbent: 'Josh Shapiro', party: 'D', ratings: r('Solid D', 'Safe D', 'Solid D'), notes: 'Shapiro seeking re-election', candidates: [R('Stacy Garrity'), D('Josh Shapiro')] },
  { state: 'CA', name: 'California', incumbent: 'Gavin Newsom', party: 'D', ratings: r('Solid D', 'Safe D', 'Solid D'), notes: 'Newsom term-limited; open race', candidates: [D('Xavier Becerra'), R('Steve Hilton')] },
]

/** Closest races first, judged by all three forecasters together; ties by state name. */
export const KEY_GOV_RACES_2026: GovernorRace[] = [...RACES].sort(
  (a, b) => competitiveness(a.ratings) - competitiveness(b.ratings) || a.name.localeCompare(b.name),
)

/**
 * The rated race for one state, or undefined. Only the dozen most-watched
 * races are rated here — a state with no row may still elect a governor this
 * year, so callers must not say "no governor race" on the strength of this.
 */
export function governorRaceFor(stateCode: string): GovernorRace | undefined {
  return KEY_GOV_RACES_2026.find(r => r.state === stateCode.toUpperCase())
}

/**
 * Governor race ratings — the one dataset on the site entered by hand.
 *
 * The FEC supplies candidates and money; nobody supplies forecasts, so these
 * rows and GOV_RATINGS_CHECKED must be updated together, and the date is shown
 * to readers wherever the ratings appear.
 *
 * Checked 2026-10-28 (six days out). Added Kansas at Lean R — an open seat
 * (Kelly term-limited) that Ballotpedia, MultiState and Cook's own race page
 * all put at Lean R.
 *
 * Ohio is left at Toss-up deliberately. One outlet reported on Oct 23 that
 * Cook moved it to Lean D, and Sabato's Crystal Ball did move it on Oct 22,
 * but cookpolitical.com returns 403 to automated requests, so the move could
 * not be confirmed at the source. Toss-up is the last Cook rating that could
 * be verified (MultiState, Oct 22). If you can open Cook in a browser and it
 * says Lean D, change that row and this date together.
 *
 * Earlier: Texas and Florida moved Likely R -> Lean R (Cook, Oct 1), and Iowa
 * was added at Lean D, the one governor race Cook rates to flip.
 */

export const GOV_RATINGS_CHECKED = 'Oct 28, 2026'

export interface GovernorRace {
  state: string
  name: string
  incumbent: string
  party: 'R' | 'D' | 'I'
  rating: string
  notes: string
}

export const KEY_GOV_RACES_2026: GovernorRace[] = [
  { state: 'GA', name: 'Georgia', incumbent: 'Brian Kemp', party: 'R', rating: 'Toss-up', notes: 'Kemp term-limited; open race' },
  { state: 'NV', name: 'Nevada', incumbent: 'Joe Lombardo', party: 'R', rating: 'Toss-up', notes: 'Lombardo seeking a second term' },
  { state: 'OH', name: 'Ohio', incumbent: 'Mike DeWine', party: 'R', rating: 'Toss-up', notes: 'DeWine term-limited; open race' },
  { state: 'WI', name: 'Wisconsin', incumbent: 'Tony Evers', party: 'D', rating: 'Toss-up', notes: 'Evers retiring; open race' },
  { state: 'IA', name: 'Iowa', incumbent: 'Kim Reynolds', party: 'R', rating: 'Lean D', notes: 'Reynolds not seeking a third term; open race' },
  { state: 'AZ', name: 'Arizona', incumbent: 'Katie Hobbs', party: 'D', rating: 'Lean D', notes: 'Hobbs seeking a second term' },
  { state: 'MI', name: 'Michigan', incumbent: 'Gretchen Whitmer', party: 'D', rating: 'Lean D', notes: 'Whitmer term-limited; open race' },
  { state: 'KS', name: 'Kansas', incumbent: 'Laura Kelly', party: 'D', rating: 'Lean R', notes: 'Kelly term-limited; open race' },
  { state: 'TX', name: 'Texas', incumbent: 'Greg Abbott', party: 'R', rating: 'Lean R', notes: 'Abbott seeking re-election' },
  { state: 'FL', name: 'Florida', incumbent: 'Ron DeSantis', party: 'R', rating: 'Lean R', notes: 'DeSantis term-limited; open race' },
  { state: 'NY', name: 'New York', incumbent: 'Kathy Hochul', party: 'D', rating: 'Solid D', notes: 'Hochul seeking re-election' },
  { state: 'PA', name: 'Pennsylvania', incumbent: 'Josh Shapiro', party: 'D', rating: 'Solid D', notes: 'Shapiro seeking re-election' },
  { state: 'CA', name: 'California', incumbent: 'Gavin Newsom', party: 'D', rating: 'Solid D', notes: 'Newsom term-limited; open race' },
]

/**
 * The rated race for one state, or undefined. Only the dozen most-watched
 * races are rated here — a state with no row may still elect a governor this
 * year, so callers must not say "no governor race" on the strength of this.
 */
export function governorRaceFor(stateCode: string): GovernorRace | undefined {
  return KEY_GOV_RACES_2026.find(r => r.state === stateCode.toUpperCase())
}

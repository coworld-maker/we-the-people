/**
 * Governor race ratings — the one dataset on the site entered by hand.
 *
 * The FEC supplies candidates and money; nobody supplies forecasts, so these
 * rows and GOV_RATINGS_CHECKED must be updated together, and the date is shown
 * to readers wherever the ratings appear.
 *
 * Checked 2026-10-14 against Cook Political Report's ratings of 2026-10-13:
 * Texas and Florida moved Likely R -> Lean R (Cook, Oct 1), and Iowa was
 * missing entirely — competitive since April and now Lean D, the one governor
 * race Cook rates to flip. Cook's four toss-ups (GA, NV, OH, WI) were already
 * right. Re-check weekly until Nov 3; ratings move fastest in the last weeks.
 */

export const GOV_RATINGS_CHECKED = 'Oct 14, 2026'

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

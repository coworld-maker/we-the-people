// Static fallback for the elections calendar.
//
// The live calendar previously came from the Google Civic Information API, which
// Google has retired. Rather than show a broken/empty widget, we render a small
// set of authoritative, nationwide election dates here. Keep this list to dates
// that are publicly fixed and verifiable (federal general elections); point users
// to Vote.gov for state-specific primaries/runoffs. Past dates self-hide.

export interface StaticElection {
  id: string
  name: string
  electionDay: string // YYYY-MM-DD
  ocdDivisionId: string // "country:us" for nationwide; "state:xx" for state-level
}

// Federal general elections are the first Tuesday after the first Monday in
// November of even years — fixed in law, safe to hardcode.
export const STATIC_UPCOMING_ELECTIONS: StaticElection[] = [
  {
    id: 'us-general-2026',
    name: '2026 U.S. General Election (Midterms)',
    electionDay: '2026-11-03',
    ocdDivisionId: 'country:us',
  },
  {
    id: 'us-general-2028',
    name: '2028 U.S. General Election (Presidential)',
    electionDay: '2028-11-07',
    ocdDivisionId: 'country:us',
  },
]

/** Returns the static elections whose date is today or in the future. */
export function futureStaticElections(now: Date = new Date()): StaticElection[] {
  const todayMs = new Date(now.toISOString().slice(0, 10) + 'T00:00:00').getTime()
  return STATIC_UPCOMING_ELECTIONS.filter(
    e => new Date(e.electionDay + 'T12:00:00').getTime() >= todayMs
  )
}

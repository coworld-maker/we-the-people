/**
 * Senate races from FEC filings (OpenFEC `/elections/`).
 *
 * The FEC lists everyone who FILED for a seat — including candidates who later
 * lost a primary or withdrew — and doesn't mark primary results. So the UI must
 * say "filed with the FEC, by money raised", never "on the ballot" or
 * "nominee". Incumbency comes from the FEC's own `incumbent_challenge_full`:
 * a retiring senator isn't listed, and every candidate for an open seat is
 * flagged "Open seat".
 */

export interface FecElectionCandidate {
  candidate_id: string
  candidate_name: string          // "OSSOFF, T. JONATHAN"
  party_full: string | null       // "DEMOCRATIC PARTY"
  incumbent_challenge_full: string | null  // "Incumbent" | "Challenger" | "Open seat" | null
  total_receipts: number | null
  coverage_end_date: string | null         // "2026-06-30T00:00:00" or "2026-06-30"
  candidate_pcc_id?: string | null         // principal campaign committee
}

const lastName = (fecName: string) => (fecName.split(',')[0] ?? '').trim().toUpperCase()

/**
 * Two FEC rows are one campaign when they share a principal campaign committee
 * — or, if a committee id is missing, the same last name, party and exact
 * (non-zero) total raised. The FEC sometimes keeps two candidate records for
 * one person (Colorado 2026 listed "Robert Chew" and "Bob Chew", same $1.3M).
 */
function sameCampaign(a: FecElectionCandidate, b: FecElectionCandidate): boolean {
  if (a.candidate_pcc_id && b.candidate_pcc_id && a.candidate_pcc_id === b.candidate_pcc_id) return true
  const raisedA = a.total_receipts ?? 0
  return raisedA > 0
    && raisedA === (b.total_receipts ?? 0)
    && lastName(a.candidate_name) === lastName(b.candidate_name)
    && (a.party_full ?? '') === (b.party_full ?? '')
}

/** Collapse duplicate records of one campaign, keeping the one with the latest report. */
export function dedupeCampaigns(rows: FecElectionCandidate[]): FecElectionCandidate[] {
  const out: FecElectionCandidate[] = []
  for (const r of rows) {
    const i = out.findIndex(o => sameCampaign(o, r))
    if (i === -1) out.push(r)
    else if ((r.coverage_end_date ?? '') > (out[i].coverage_end_date ?? '')) out[i] = r
  }
  return out
}

export type PartyCode = 'D' | 'R' | 'I' | 'L' | 'G' | 'O'

export interface RaceCandidate {
  id: string
  name: string
  party: PartyCode
  incumbent: boolean
  raised: number
}

export interface SenateRace {
  state: string
  openSeat: boolean
  candidates: RaceCandidate[]
  /** Everyone who filed, before trimming to the top fundraisers. */
  filedCount: number
  /** Latest FEC reporting date among the shown candidates (YYYY-MM-DD). */
  asOf: string | null
}

const SUFFIXES = new Set(['JR', 'SR', 'II', 'III', 'IV'])
// Honorifics the FEC sometimes appends to a name ("CORNYN, JOHN SEN").
const TITLES = new Set(['MR', 'MRS', 'MS', 'DR', 'SEN', 'HON', 'REP', 'GOV'])

function titleCase(word: string): string {
  const cap = word.toLowerCase().replace(/(^|[-'])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase())
  return cap.replace(/^Mc([a-z])/, (_, c: string) => 'Mc' + c.toUpperCase())
}

/** "OSSOFF, T. JONATHAN" → "T. Jonathan Ossoff"; "DUBLIN, MICHAEL LOUIS JR." → "Michael Louis Dublin Jr." */
export function displayName(fecName: string): string {
  const [lastRaw = '', restRaw = ''] = fecName.split(',').map(s => s.trim())
  const given: string[] = []
  const suffix: string[] = []
  for (const token of restRaw.split(/\s+/).filter(Boolean)) {
    const bare = token.replace(/\./g, '').toUpperCase()
    if (TITLES.has(bare)) continue
    if (SUFFIXES.has(bare)) {
      suffix.push(bare === 'JR' || bare === 'SR' ? `${titleCase(bare)}.` : bare)
      continue
    }
    given.push(titleCase(token))
  }
  return [...given, ...lastRaw.split(/\s+/).map(titleCase), ...suffix].join(' ').trim()
}

export function partyCode(partyFull: string | null): PartyCode {
  const p = (partyFull ?? '').toUpperCase()
  if (p.includes('DEMOCRAT')) return 'D'
  if (p.includes('REPUBLICAN')) return 'R'
  if (p.includes('INDEPENDENT')) return 'I'
  if (p.includes('LIBERTARIAN')) return 'L'
  if (p.includes('GREEN')) return 'G'
  return 'O'
}

/**
 * Trim a race to its top fundraisers (the incumbent is always kept), ordered
 * by money raised. `minRaised` drops the long tail of filers who raised little
 * or nothing; the full list stays one click away on fec.gov.
 */
export function summarizeRace(
  state: string,
  rows: FecElectionCandidate[],
  {
    max = 4,
    minRaised = 100_000,
    today = new Date().toISOString().slice(0, 10),
  }: { max?: number; minRaised?: number; today?: string } = {},
): SenateRace {
  const raised = (r: FecElectionCandidate) => r.total_receipts ?? 0
  const campaigns = dedupeCampaigns(rows)
  const sorted = [...campaigns].sort((a, b) => raised(b) - raised(a))
  const isIncumbent = (r: FecElectionCandidate) => r.incumbent_challenge_full === 'Incumbent'

  const incumbents = sorted.filter(isIncumbent)
  const others = sorted.filter(r => !isIncumbent(r) && raised(r) >= minRaised)
  const picked = [...incumbents, ...others]
    .slice(0, Math.max(max, incumbents.length))
    .sort((a, b) => raised(b) - raised(a))

  // Some FEC records carry a coverage end date after today (production showed
  // "reports through 2026-09-30" on Sept 12). A report can't cover days that
  // haven't happened, so future dates never become the "as of" date.
  const dates = picked
    .map(r => r.coverage_end_date?.slice(0, 10))
    .filter((d): d is string => !!d && d <= today)
    .sort()

  return {
    state,
    openSeat: incumbents.length === 0,
    candidates: picked.map(r => ({
      id: r.candidate_id,
      name: displayName(r.candidate_name),
      party: partyCode(r.party_full),
      incumbent: isIncumbent(r),
      raised: raised(r),
    })),
    filedCount: campaigns.length,
    asOf: dates.at(-1) ?? null,
  }
}

/** A sitting senator from our member table: full state name, party 'R' | 'D' | 'I'. */
export interface SeatedSenator {
  state: string
  lastName: string
  party: string
}

/**
 * Some FEC records carry no usable party — production showed Idaho's James
 * Risch, a Republican, as "(O)". An incumbent's party is already known from the
 * member table, so when the FEC label is "O" it comes from the senator seated
 * in that state with the same last name. Challengers are left as the FEC says.
 */
export function applyIncumbentParties(
  races: SenateRace[],
  senators: SeatedSenator[],
  stateName: (code: string) => string | null,
): SenateRace[] {
  return races.map(race => {
    const seated = senators.filter(s => s.state === (stateName(race.state) ?? race.state))
    return {
      ...race,
      candidates: race.candidates.map(c => {
        if (!c.incumbent || c.party !== 'O') return c
        const words = c.name.toLowerCase().split(/\s+/)
        const match = seated.find(s => words.includes(s.lastName.toLowerCase()))
        if (!match) return c
        const p = match.party.trim().toUpperCase()
        const party = (['D', 'R', 'I', 'L', 'G'].includes(p) ? p : partyCode(match.party)) as PartyCode
        return { ...c, party }
      }),
    }
  })
}

/** $97,986,263 → "$98.0M"; $563,078 → "$563K". */
export function formatRaised(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

/**
 * What a voter in one state decides on November 3, 2026, assembled from what
 * the site already knows: every House seat is up, the state's Senate seat is
 * up only if the FEC shows a 2026 race for it, and a governor rating exists
 * for a dozen watched states.
 *
 * What this is NOT: a ballot. It never lists the candidates a voter will see
 * — FEC filings include people who lost primaries or withdrew, and no federal
 * source carries state or local contests at all. Pages built from this must
 * send readers to their state's election office for the real ballot.
 */

import type { SenateRace } from '@/lib/data/senateRaces'
import type { GovernorRace } from '@/lib/data/governorRaces'

/** Federal Election Day 2026. */
export const ELECTION_DAY = '2026-11-03'

/** Whole days from `today` to Election Day; 0 once it has arrived or passed. */
export function daysUntilElection(today: Date = new Date()): number {
  const day = new Date(`${ELECTION_DAY}T00:00:00Z`)
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  return Math.max(0, Math.round((day.getTime() - from.getTime()) / 86_400_000))
}

export interface StateBallot {
  code: string
  name: string
  /** House seats this state elects — every seat is up every two years. */
  houseSeats: number
  /** Set only when the FEC shows a 2026 Senate race in this state. */
  senate?: SenateRace
  /** Set only for the dozen states with a hand-entered rating. */
  governor?: GovernorRace
  /** True when there is a statewide contest beyond the House seats. */
  hasStatewideRace: boolean
}

export function buildStateBallot(input: {
  code: string
  name: string
  houseSeats: number
  senate?: SenateRace | null
  governor?: GovernorRace | null
}): StateBallot {
  const senate = input.senate ?? undefined
  const governor = input.governor ?? undefined
  return {
    code: input.code.toUpperCase(),
    name: input.name,
    houseSeats: Math.max(0, input.houseSeats),
    senate,
    governor,
    hasStatewideRace: !!senate || !!governor,
  }
}

/**
 * One line summarising the state's federal races, for page metadata and
 * search results. Deliberately plain: counts and offices, no predictions.
 */
export function ballotSummary(b: StateBallot): string {
  const parts: string[] = []
  if (b.houseSeats === 1) parts.push('1 U.S. House seat')
  else if (b.houseSeats > 1) parts.push(`all ${b.houseSeats} U.S. House seats`)
  if (b.senate) parts.push('a U.S. Senate seat')
  if (b.governor) parts.push('the governor’s office')
  if (!parts.length) return `Federal elections in ${b.name} on November 3, 2026.`
  const list =
    parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return `${b.name} votes on ${list} on November 3, 2026.`
}

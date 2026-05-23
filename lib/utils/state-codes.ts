/**
 * Shared lookups between 2-letter state codes and full state names.
 *
 * Use this anywhere code needs to bridge our codebase's two state conventions:
 *   - URLs, prop maps, GeoJSON: 2-letter code ('CA', 'TX')
 *   - Prisma `Representative.state`: full name ('California', 'Texas')
 *
 * Includes territories (PR, GU, VI, AS, MP) plus DC so queries against the
 * Representative table cover non-voting delegates too.
 */

export const ABBR_TO_NAME: Record<string, string> = {
  AL: 'Alabama',   AK: 'Alaska',         AZ: 'Arizona',     AR: 'Arkansas',  CA: 'California',
  CO: 'Colorado',  CT: 'Connecticut',    DE: 'Delaware',    FL: 'Florida',   GA: 'Georgia',
  HI: 'Hawaii',    ID: 'Idaho',          IL: 'Illinois',    IN: 'Indiana',   IA: 'Iowa',
  KS: 'Kansas',    KY: 'Kentucky',       LA: 'Louisiana',   ME: 'Maine',     MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan',   MN: 'Minnesota',   MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana',   NE: 'Nebraska',       NV: 'Nevada',      NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York',      NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma',  OR: 'Oregon',         PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee',   TX: 'Texas',       UT: 'Utah',      VT: 'Vermont',
  VA: 'Virginia',  WA: 'Washington',     WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
  PR: 'Puerto Rico', GU: 'Guam',         VI: 'Virgin Islands',
  AS: 'American Samoa', MP: 'Northern Mariana Islands',
}

export const NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(ABBR_TO_NAME).map(([abbr, name]) => [name, abbr]),
)

/** Convert a stored Representative.state (full name) to its 2-letter code.
 *  Returns null if the name isn't recognized. */
export function nameToAbbr(name: string | null | undefined): string | null {
  if (!name) return null
  return NAME_TO_ABBR[name] ?? null
}

/** Convert a 2-letter code to the full name used by Representative.state. */
export function abbrToName(abbr: string | null | undefined): string | null {
  if (!abbr) return null
  return ABBR_TO_NAME[abbr.toUpperCase()] ?? null
}

import zipDistricts from './zip-districts.json'

/**
 * ZIP → congressional district resolution.
 *
 * Source: OpenSourceActivismTech/us-zipcodes-congress (`zccd.csv`), a ZCTA→CD
 * crosswalk. No external API: Google retired the Civic Information API's
 * representative lookup, and Congress.gov's /v3/member silently ignores its
 * zipCode param (it returns an arbitrary member list — we shipped that bug
 * briefly).
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * The bundled dataset used to store ONE district per ZIP, and both API routes
 * returned it as fact. That was wrong for a fifth of the country:
 *
 *   • 7,299 of 33,774 ZIPs (21.6%) span more than one district
 *   • 109 of those span more than one STATE — so the lookup returned the wrong
 *     senators, not merely the wrong House member
 *
 * The collapsed value was also described in the old code as the "dominant"
 * district. It was not: it matched the FIRST row in the upstream CSV in 7,299
 * of 7,299 cases, and the crosswalk carries no population weighting to make a
 * dominance claim from. ZIP 30165 is Rome, GEORGIA; the first upstream row is
 * AL-3, so the app told those visitors their senators were Alabama's.
 *
 * A ZIP that spans districts has NO single correct answer — the caller must ask
 * the visitor which district is theirs. Do not reintroduce a "pick the first
 * one" default: silently choosing is what made this a bug rather than a gap.
 */

export interface ZipMatch {
  /** Two-letter state abbreviation, e.g. "GA". */
  state: string
  /** District number as a string; "0" for at-large states. */
  district: string
}

export interface ZipLookup {
  zip: string
  /** Every district this ZIP touches. Never empty when this is non-null. */
  matches: ZipMatch[]
  /** True when the ZIP spans more than one district — caller MUST disambiguate. */
  ambiguous: boolean
  /** True when the matches span more than one state (senators differ too). */
  crossState: boolean
}

const RAW = zipDistricts as Record<string, string[]>

/**
 * Resolve a 5-digit ZIP. Returns null when the ZIP is not a ZCTA at all
 * (PO-box-only ZIPs are the usual cause) — callers should suggest a nearby ZIP
 * rather than guessing.
 */
export function lookupZip(zip: string): ZipLookup | null {
  if (!/^\d{5}$/.test(zip)) return null
  const entries = RAW[zip]
  if (!entries || entries.length === 0) return null

  const matches: ZipMatch[] = entries.map(e => {
    const [state, district] = e.split('-')
    return { state, district }
  })

  return {
    zip,
    matches,
    ambiguous: matches.length > 1,
    crossState: new Set(matches.map(m => m.state)).size > 1,
  }
}

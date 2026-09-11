/**
 * Pure parsing of a US Census Bureau geocoder response
 * (geocoder/geographies/address, layers=all) into the district encoding used
 * by lib/data/zip-lookup.ts: 2-letter state + district number as a string with
 * no leading zeros, "0" for at-large seats (including DC's delegate).
 *
 * Kept out of route.ts because Next.js route files may only export handlers.
 */

export interface DistrictMatch { state: string; district: string }

type Geo = Record<string, string | undefined>

function normalizeDistrict(code: string): string | null {
  // "00" = at-large state, "98" = non-voting delegate (DC, PR, territories).
  if (code === '00' || code === '98') return '0'
  // "ZZ" and similar mark water/undefined areas — not a real district.
  if (!/^\d{1,2}$/.test(code)) return null
  return String(parseInt(code, 10))
}

export function parseCensusDistrict(json: unknown): DistrictMatch | null {
  const match = (json as any)?.result?.addressMatches?.[0]
  if (!match || typeof match !== 'object') return null
  const geos: Record<string, Geo[]> = match.geographies ?? {}

  // Layer name tracks the Congress ("119th Congressional Districts"); find it
  // by suffix so the next redistricting session doesn't break us.
  const cdKey = Object.keys(geos).find(k => /Congressional Districts$/i.test(k))
  const cd = cdKey ? geos[cdKey]?.[0] : undefined
  if (!cd) return null
  const cdField = Object.keys(cd).find(k => /^CD\d+$/.test(k))
  const code = cdField ? cd[cdField] : undefined
  if (!code) return null
  const district = normalizeDistrict(code)
  if (district === null) return null

  const state = geos['States']?.[0]?.STUSAB ?? match.addressComponents?.state
  if (typeof state !== 'string' || !/^[A-Z]{2}$/.test(state)) return null

  return { state, district }
}

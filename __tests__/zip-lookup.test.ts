import { describe, it, expect } from 'vitest'
import zipDistricts from '@/lib/data/zip-districts.json'
import { lookupZip } from '@/lib/data/zip-lookup'

/**
 * Regression cover for the ZIP→district collapse.
 *
 * The bundled dataset stored ONE district per ZIP and both API routes returned
 * it as fact. 7,299 of 33,774 ZIPs (21.6%) actually span several districts, and
 * 109 span a state line — so those visitors were shown the wrong House member,
 * and in 109 ZIPs the wrong senators. The collapsed value was documented as the
 * "dominant" district but was simply the first row of the upstream CSV in
 * 7,299 of 7,299 cases; the crosswalk carries no population weighting.
 *
 * These tests hold the invariants that make silently picking one district
 * impossible to reintroduce. Pure (no DB, no network) so they run in CI.
 */

const RAW = zipDistricts as Record<string, string[]>

describe('lookupZip', () => {
  it('resolves an unambiguous ZIP to exactly one district', () => {
    const r = lookupZip('30303') // Atlanta
    expect(r).not.toBeNull()
    expect(r!.matches).toEqual([{ state: 'GA', district: '5' }])
    expect(r!.ambiguous).toBe(false)
    expect(r!.crossState).toBe(false)
  })

  it('returns EVERY district for a ZIP that spans several', () => {
    // Real value: this ZIP is split between two Massachusetts districts.
    const r = lookupZip('01002')
    expect(r!.matches).toEqual([
      { state: 'MA', district: '1' },
      { state: 'MA', district: '2' },
    ])
    expect(r!.ambiguous).toBe(true)
    expect(r!.crossState).toBe(false)
  })

  it('flags a ZIP that crosses a state line', () => {
    // 30165 is Rome, GEORGIA. The first upstream row is AL-3, so the old code
    // told these visitors their senators were Alabama's.
    const r = lookupZip('30165')
    expect(r!.matches).toContainEqual({ state: 'GA', district: '14' })
    expect(r!.matches).toContainEqual({ state: 'AL', district: '3' })
    expect(r!.ambiguous).toBe(true)
    expect(r!.crossState).toBe(true)
  })

  it('handles at-large states as district "0"', () => {
    const r = lookupZip('00601')
    expect(r!.matches).toEqual([{ state: 'PR', district: '0' }])
    expect(r!.ambiguous).toBe(false)
  })

  it('returns null rather than guessing for unknown or malformed input', () => {
    expect(lookupZip('00000')).toBeNull()   // not a ZCTA
    expect(lookupZip('1234')).toBeNull()    // too short
    expect(lookupZip('123456')).toBeNull()  // too long
    expect(lookupZip('abcde')).toBeNull()
    expect(lookupZip('')).toBeNull()
  })

  it('never returns an empty match list alongside a non-null result', () => {
    for (const zip of ['30303', '01002', '30165', '00601']) {
      const r = lookupZip(zip)
      expect(r!.matches.length).toBeGreaterThan(0)
    }
  })
})

describe('zip-districts dataset', () => {
  it('preserves multi-district ZIPs instead of collapsing them', () => {
    // The whole point of the fix. If someone regenerates this file with a
    // "pick the dominant one" step, this count drops to zero and fails here.
    const multi = Object.values(RAW).filter(v => v.length > 1)
    expect(multi.length).toBeGreaterThan(7000)
  })

  it('still contains the cross-state ZIPs that produced wrong senators', () => {
    const crossState = Object.values(RAW).filter(
      v => new Set(v.map(x => x.split('-')[0])).size > 1
    )
    expect(crossState.length).toBeGreaterThanOrEqual(100)
  })

  it('stores every entry as a non-empty array of STATE-DISTRICT strings', () => {
    for (const [zip, v] of Object.entries(RAW)) {
      expect(Array.isArray(v), `${zip} is not an array`).toBe(true)
      expect(v.length, `${zip} is empty`).toBeGreaterThan(0)
      for (const entry of v) {
        expect(entry, `${zip} has malformed entry "${entry}"`).toMatch(/^[A-Z]{2}-\d+$/)
      }
    }
  })

  it('has no duplicate districts within a single ZIP', () => {
    for (const [zip, v] of Object.entries(RAW)) {
      expect(new Set(v).size, `${zip} repeats a district`).toBe(v.length)
    }
  })
})

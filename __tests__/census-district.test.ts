import { describe, it, expect } from 'vitest'
import { parseCensusDistrict } from '@/app/api/landing/district-by-address/parse'

/**
 * Fixtures are real US Census geocoder responses (geographies/address,
 * Public_AR_Current / Current_Current, layers=all), fetched 2026-09-10 and
 * stripped to the fields the parser reads.
 */

// street "601 Broad St", zip "30161" (Rome, GA)
const ROME_GA = {
  result: {
    addressMatches: [{
      matchedAddress: '601 BROAD ST, ROME, GA, 30161',
      addressComponents: { zip: '30161', city: 'ROME', state: 'GA' },
      geographies: {
        '119th Congressional Districts': [{
          GEOID: '1314', CDSESSN: '119', BASENAME: '14', STATE: '13',
          NAME: 'Congressional District 14', CD119: '14',
        }],
        States: [{ GEOID: '13', STATE: '13', BASENAME: 'Georgia', STUSAB: 'GA', NAME: 'Georgia' }],
      },
    }],
  },
}

// street "1600 Pennsylvania Ave NW", zip "20500"
const WHITE_HOUSE = {
  result: {
    addressMatches: [{
      addressComponents: { zip: '20500', state: 'DC' },
      geographies: {
        '119th Congressional Districts': [{
          GEOID: '1198', CDSESSN: '119', BASENAME: 'Delegate District (at Large)', STATE: '11',
          NAME: 'Delegate District (at Large)', CD119: '98',
        }],
        States: [{ GEOID: '11', STATE: '11', BASENAME: 'District of Columbia', STUSAB: 'DC', NAME: 'District of Columbia' }],
      },
    }],
  },
}

// street "200 W 24th St", zip "82001" (Cheyenne, WY — at-large)
const CHEYENNE_WY = {
  result: {
    addressMatches: [{
      addressComponents: { zip: '82001', state: 'WY' },
      geographies: {
        '119th Congressional Districts': [{
          BASENAME: 'Congressional District (at Large)', STATE: '56',
          NAME: 'Congressional District (at Large)', CD119: '00',
        }],
        States: [{ STATE: '56', STUSAB: 'WY', NAME: 'Wyoming' }],
      },
    }],
  },
}

// street "99999 Nowhere Rd", zip "30161"
const NO_MATCH = { result: { input: { address: { zip: '30161' } }, addressMatches: [] } }

describe('parseCensusDistrict', () => {
  it('reads the congressional district and postal state', () => {
    expect(parseCensusDistrict(ROME_GA)).toEqual({ state: 'GA', district: '14' })
  })

  it('maps at-large ("00") and delegate ("98") seats to the "0" encoding zip-lookup uses', () => {
    expect(parseCensusDistrict(CHEYENNE_WY)).toEqual({ state: 'WY', district: '0' })
    expect(parseCensusDistrict(WHITE_HOUSE)).toEqual({ state: 'DC', district: '0' })
  })

  it('strips leading zeros', () => {
    const f = structuredClone(ROME_GA)
    f.result.addressMatches[0].geographies['119th Congressional Districts'][0].CD119 = '05'
    expect(parseCensusDistrict(f)).toEqual({ state: 'GA', district: '5' })
  })

  it('finds a future session layer/field by pattern', () => {
    const f: any = structuredClone(ROME_GA)
    const g = f.result.addressMatches[0].geographies
    const layer = g['119th Congressional Districts'][0]
    delete layer.CD119
    g['121st Congressional Districts'] = [{ ...layer, CD121: '3' }]
    delete g['119th Congressional Districts']
    expect(parseCensusDistrict(f)).toEqual({ state: 'GA', district: '3' })
  })

  it('falls back to addressComponents.state when the States layer is absent', () => {
    const f: any = structuredClone(ROME_GA)
    delete f.result.addressMatches[0].geographies.States
    expect(parseCensusDistrict(f)).toEqual({ state: 'GA', district: '14' })
  })

  it('returns null for no match, water districts, or garbage', () => {
    expect(parseCensusDistrict(NO_MATCH)).toBeNull()
    const f = structuredClone(ROME_GA)
    f.result.addressMatches[0].geographies['119th Congressional Districts'][0].CD119 = 'ZZ'
    expect(parseCensusDistrict(f)).toBeNull()
    expect(parseCensusDistrict(null)).toBeNull()
    expect(parseCensusDistrict({ result: {} })).toBeNull()
  })
})

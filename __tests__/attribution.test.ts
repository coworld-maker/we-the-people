import { describe, it, expect } from 'vitest'
import { parseUtm, referrerHost, hasAttribution } from '../lib/data/attribution'

describe('parseUtm', () => {
  it('reads the tags our social links carry', () => {
    expect(parseUtm('?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=r4')).toEqual({
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'launch',
      utmContent: 'r4',
    })
  })

  it('works with or without the leading question mark', () => {
    expect(parseUtm('utm_source=facebook')).toEqual({ utmSource: 'facebook' })
  })

  it('ignores empty, blank and absent tags', () => {
    expect(parseUtm('?utm_source=&utm_medium=%20&foo=bar')).toEqual({})
    expect(parseUtm('')).toEqual({})
  })

  it('caps a stuffed value at 80 characters', () => {
    expect(parseUtm(`?utm_campaign=${'x'.repeat(200)}`).utmCampaign).toHaveLength(80)
  })
})

describe('referrerHost', () => {
  it('keeps only the hostname of an external referrer', () => {
    expect(referrerHost('https://l.instagram.com/?u=something&e=abc', 'www.democracyunlocked.com')).toBe('l.instagram.com')
    expect(referrerHost('https://www.facebook.com/groups/123', 'www.democracyunlocked.com')).toBe('www.facebook.com')
  })

  it('drops same-site navigation, with or without www', () => {
    expect(referrerHost('https://www.democracyunlocked.com/bills', 'www.democracyunlocked.com')).toBeUndefined()
    expect(referrerHost('https://democracyunlocked.com/about', 'www.democracyunlocked.com')).toBeUndefined()
  })

  it('returns nothing for a missing or unparseable referrer', () => {
    expect(referrerHost('', 'www.democracyunlocked.com')).toBeUndefined()
    expect(referrerHost(null, 'www.democracyunlocked.com')).toBeUndefined()
    expect(referrerHost('not a url', 'www.democracyunlocked.com')).toBeUndefined()
  })
})

describe('hasAttribution', () => {
  it('is true only when something was found', () => {
    expect(hasAttribution({})).toBe(false)
    expect(hasAttribution({ utmSource: 'instagram' })).toBe(true)
    expect(hasAttribution({ referrerHost: 'instagram.com' })).toBe(true)
  })
})

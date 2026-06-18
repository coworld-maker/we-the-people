import { describe, it, expect } from 'vitest'
import { billCodeKeys } from '@/lib/news-match'

describe('billCodeKeys', () => {
  it('extracts common bill codes in various formats', () => {
    expect(billCodeKeys('The House passed HR 1234 today')).toContain('HR1234')
    expect(billCodeKeys('per H.R. 1234')).toContain('HR1234')
    expect(billCodeKeys('Senate bill S 2 advances')).toContain('S2')
    expect(billCodeKeys('see S.J.Res. 5')).toContain('SJRES5')
    expect(billCodeKeys('H.Res. 1369 introduced')).toContain('HRES1369')
    expect(billCodeKeys('H.Con.Res. 110 on Iran')).toContain('HCONRES110')
  })

  it('dedupes repeated mentions', () => {
    expect(billCodeKeys('HR 1234 and HR 1234 again')).toEqual(['HR1234'])
  })

  it('does not match bare words without a number', () => {
    expect(billCodeKeys('the Senate and the House debated')).toEqual([])
  })

  it('returns empty for text with no codes', () => {
    expect(billCodeKeys('A bill about healthcare reform')).toEqual([])
  })

  it('distinguishes HRES from HR', () => {
    const keys = billCodeKeys('HRES 5')
    expect(keys).toContain('HRES5')
    expect(keys).not.toContain('HR5')
  })
})

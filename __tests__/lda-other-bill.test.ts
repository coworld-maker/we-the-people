import { describe, it, expect } from 'vitest'
import { namesOtherBill } from '../lib/api/lda'

// H.R. 1 of the 119th Congress: official title + popular name.
const HR1 = [
  'An act to provide for reconciliation pursuant to title II of H. Con. Res. 14.',
  'One Big Beautiful Bill Act',
]

describe('namesOtherBill', () => {
  it("drops filings that name the 118th Congress's H.R. 1", () => {
    expect(namesOtherBill(', Lower Energy Costs Act; H.R. 3746, Fiscal Responsibility Act', HR1)).toBe(true)
    expect(namesOtherBill(' - Lower Energy Costs Act Department of the Interior', HR1)).toBe(true)
    expect(namesOtherBill(' Lower Energy Costs Act H.R. 7033 - WEST Act of 2024', HR1)).toBe(true)
  })

  it('keeps filings that name this bill', () => {
    expect(namesOtherBill(', the One Big Beautiful Bill Act (P.L. 119-21)', HR1)).toBe(false)
    expect(namesOtherBill(', "An Act to provide for reconciliation pursuant to title II"', HR1)).toBe(false)
  })

  it('keeps filings it cannot positively identify as another bill', () => {
    expect(namesOtherBill(', the One Big, Beautiful Bill Act (P.L. 119-21)', HR1)).toBe(false) // comma stops the name
    expect(namesOtherBill(', One Big Beautiful Bill and provisions relating to federal land', HR1)).toBe(false)
    expect(namesOtherBill(' intersect with previous IRA credit structures.', HR1)).toBe(false)
    expect(namesOtherBill(', Medicaid, SNAP and the Social Security Act', HR1)).toBe(false)
    expect(namesOtherBill('', HR1)).toBe(false)
  })

  it('never drops anything when the bill has no known titles', () => {
    expect(namesOtherBill(', Lower Energy Costs Act', [])).toBe(false)
    expect(namesOtherBill(', Lower Energy Costs Act', [null, undefined])).toBe(false)
  })
})

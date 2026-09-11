import { describe, expect, it } from 'vitest'
import { keyLockLabel, toothDepth } from '@/components/landing/KeyLock'

describe('toothDepth', () => {
  it('leaves a blank position uncut (not the biggest tooth)', () => {
    expect(toothDepth(undefined)).toBe(0)
    expect(toothDepth('')).toBe(0)
  })

  it('spans 14 (digit 0) to 58 (digit 9)', () => {
    expect(toothDepth('0')).toBe(14)
    expect(toothDepth('9')).toBe(58)
  })

  it('gives every digit a clearly different depth', () => {
    const depths = '0123456789'.split('').map(toothDepth)
    for (let i = 1; i < depths.length; i++) expect(depths[i] - depths[i - 1]).toBeGreaterThan(4.5)
  })
})

describe('keyLockLabel', () => {
  it('does not claim a ZIP cut before anything is typed', () => {
    const label = keyLockLabel('', 'idle')
    expect(label).not.toMatch(/cut from/i)
    expect(label).toMatch(/uncut key/i)
  })

  it('reads the typed digits and how many remain', () => {
    expect(keyLockLabel('123', 'idle')).toMatch(/1 2 3, 2 still to go/)
    expect(keyLockLabel('12345', 'idle')).not.toMatch(/still to go/)
  })

  it('says the lookup is in progress while turning', () => {
    expect(keyLockLabel('12345', 'turning')).toMatch(/looked up/)
  })

  it('does not promise a delegation for an ambiguous ZIP', () => {
    expect(keyLockLabel('12345', 'unlocked', true)).toMatch(/spans several districts/)
    expect(keyLockLabel('12345', 'unlocked', true)).not.toMatch(/delegation/)
    expect(keyLockLabel('12345', 'unlocked', false)).toMatch(/delegation is below/)
  })
})

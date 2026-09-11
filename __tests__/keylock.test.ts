import { describe, expect, it } from 'vitest'
import { keyLockLabel } from '@/components/landing/KeyLock'

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

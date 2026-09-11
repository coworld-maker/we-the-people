import { describe, it, expect } from 'vitest'
import { toPublicAuthor, publicThread } from '../lib/data/discussionAuthor'

const base = { id: 'u1', firstName: null, lastName: null, username: null }

describe('toPublicAuthor', () => {
  it('uses the username when there is one', () => {
    expect(toPublicAuthor({ ...base, firstName: 'Ada', lastName: 'Lovelace', username: 'ada' }).displayName).toBe('@ada')
  })

  it('falls back to first name and last initial, never the full last name', () => {
    expect(toPublicAuthor({ ...base, firstName: 'Ada', lastName: 'lovelace' }).displayName).toBe('Ada L.')
    expect(toPublicAuthor({ ...base, firstName: 'Ada' }).displayName).toBe('Ada')
    expect(toPublicAuthor(base).displayName).toBe('Citizen')
  })

  it('sends no name fields to the browser', () => {
    const out = toPublicAuthor({ ...base, firstName: 'Ada', lastName: 'Lovelace' })
    expect(Object.keys(out).sort()).toEqual(['displayName', 'id', 'username'])
    expect(JSON.stringify(out)).not.toContain('Lovelace')
  })
})

describe('publicThread', () => {
  it('replaces authors in nested replies too', () => {
    const thread = {
      id: 'c1', content: 'hi',
      user: { ...base, firstName: 'Ada', lastName: 'Lovelace' },
      replies: [{
        id: 'c2', content: 'yo',
        user: { ...base, firstName: 'Grace', lastName: 'Hopper' },
        replies: [{ id: 'c3', content: 'ok', user: { ...base, username: 'alan' } }],
      }],
    }
    const out = publicThread(thread)
    const json = JSON.stringify(out)
    expect(json).not.toMatch(/Lovelace|Hopper|firstName|lastName/)
    expect(out.user.displayName).toBe('Ada L.')
    expect(out.replies?.[0].user.displayName).toBe('Grace H.')
    expect(out.replies?.[0].replies?.[0].user.displayName).toBe('@alan')
    expect(out.content).toBe('hi')
  })
})

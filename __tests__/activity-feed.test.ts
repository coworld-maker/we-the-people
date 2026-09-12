import { describe, it, expect } from 'vitest'
import { communityVotesItem, communityCommentsItem } from '../lib/data/activityFeed'

describe('community activity wording', () => {
  it('counts people who voted, singular and plural', () => {
    expect(communityVotesItem(1, 'HR 9055')).toEqual({ user: '1 person', text: 'has voted on HR 9055' })
    expect(communityVotesItem(4, 'HR 9055')).toEqual({ user: '4 people', text: 'have voted on HR 9055' })
  })

  it('counts comments, singular and plural', () => {
    expect(communityCommentsItem(1, 'S 4042')).toEqual({ user: '1 new comment', text: 'on S 4042' })
    expect(communityCommentsItem(3, 'S 4042')).toEqual({ user: '3 comments', text: 'on S 4042' })
  })

  it('never reveals how anyone voted', () => {
    const all = [communityVotesItem(1, 'HR 1'), communityVotesItem(9, 'HR 1')]
      .map(i => `${i.user} ${i.text}`).join(' ')
    expect(all).not.toMatch(/\b(yes|no|abstain|yea|nay)\b/i)
  })
})

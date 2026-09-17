import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { parseInbound, forwardSubject, forwardHtml, verifySignature } from '../lib/data/inboundEmail'

const message = {
  from: 'someone@example.com',
  to: ['privacy@democracyunlocked.com'],
  subject: 'Delete my data',
  text: 'Please delete my account.',
}

describe('parseInbound', () => {
  it('reads a message at the top level or under data', () => {
    expect(parseInbound(message)?.from).toBe('someone@example.com')
    expect(parseInbound({ type: 'email.received', data: message })?.subject).toBe('Delete my data')
  })

  it('accepts addresses as strings or objects', () => {
    expect(parseInbound({ ...message, from: { address: 'a@b.com' } })?.from).toBe('a@b.com')
    expect(parseInbound({ ...message, to: [{ email: 'legal@democracyunlocked.com' }] })?.to).toEqual([
      'legal@democracyunlocked.com',
    ])
  })

  it('rejects anything without a sender or a body', () => {
    expect(parseInbound(null)).toBeNull()
    expect(parseInbound({ subject: 'hi' })).toBeNull()
    expect(parseInbound({ from: 'a@b.com', subject: 'hi' })).toBeNull()
  })

  it('caps a huge body and counts attachments', () => {
    const big = parseInbound({ ...message, text: 'x'.repeat(200_000), attachments: [{}, {}] })
    expect(big?.text).toHaveLength(100_000)
    expect(big?.attachments).toBe(2)
  })
})

describe('forwarded message', () => {
  it('labels the subject with the address written to', () => {
    expect(forwardSubject(parseInbound(message)!)).toBe('[privacy] Delete my data')
  })

  it('escapes the sender and body so their markup cannot act', () => {
    const evil = parseInbound({ ...message, from: '<script>x</script>@e.com', text: '<img onerror=alert(1)>' })!
    const html = forwardHtml(evil)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img onerror')
    expect(html).toContain('&lt;img onerror')
  })

  it('says when attachments were dropped', () => {
    expect(forwardHtml(parseInbound({ ...message, attachments: [{}] })!)).toContain('1 attachment(s) were not forwarded')
  })
})

describe('verifySignature', () => {
  const secret = 'whsec_' + Buffer.from('super-secret-key').toString('base64')
  const id = 'msg_123'
  const timestamp = '1700000000'
  const body = JSON.stringify(message)
  const sign = (b: string) =>
    createHmac('sha256', Buffer.from(secret.replace(/^whsec_/, ''), 'base64'))
      .update(`${id}.${timestamp}.${b}`)
      .digest('base64')
  const now = Number(timestamp)

  it('accepts a correct signature', () => {
    expect(verifySignature({ secret, id, timestamp, body, header: `v1,${sign(body)}`, nowSeconds: now })).toBe(true)
  })

  it('accepts one of several rotated signatures', () => {
    const header = `v1,${'A'.repeat(44)} v1,${sign(body)}`
    expect(verifySignature({ secret, id, timestamp, body, header, nowSeconds: now })).toBe(true)
  })

  it('rejects a tampered body, wrong secret, or missing header', () => {
    expect(verifySignature({ secret, id, timestamp, body: body + 'x', header: `v1,${sign(body)}`, nowSeconds: now })).toBe(false)
    expect(verifySignature({ secret: 'whsec_' + Buffer.from('other').toString('base64'), id, timestamp, body, header: `v1,${sign(body)}`, nowSeconds: now })).toBe(false)
    expect(verifySignature({ secret, id, timestamp, body, header: '', nowSeconds: now })).toBe(false)
  })

  it('rejects a replay from outside the time window', () => {
    expect(verifySignature({ secret, id, timestamp, body, header: `v1,${sign(body)}`, nowSeconds: now + 3600 })).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import {
  BILL_STATUSES,
  BILL_STATUS_LABELS,
  STAGE_GROUPS,
  isCanonicalStatus,
  normalizeBillStatus,
  statusesForStage,
} from '@/lib/bill-status'

/**
 * Regression cover for the status-pollution bug.
 *
 * sync-voted-bills wrote the RAW Congress.gov action text into Bill.status,
 * leaving 76 rows with values like "Became Public Law No: 119-50." — 10 of
 * which were enacted laws that no status filter could match. These tests hold
 * the invariants that make that class of bug impossible to reintroduce
 * silently. They are pure (no DB) so they run in CI, which has no database.
 */

// Real values taken from production before the backfill.
const POLLUTED_FROM_PRODUCTION: Array<[string, string]> = [
  ['Became Public Law No: 119-50.', 'enacted'],
  ['Became Public Law No: 119-8.', 'enacted'],
  ['Received in the Senate and Read twice and referred to the Committee on Finance.', 'passed_chamber'],
  ['Received in the Senate and Read twice and referred to the Committee on the Judiciary.', 'passed_chamber'],
  ['Received in the Senate.', 'passed_chamber'],
  ['Read the second time. Placed on Senate Legislative Calendar under General Orders. Calendar No. 156.', 'reported'],
  ['Message on House action received in Senate and at desk: House requests a conference.', 'resolving_differences'],
]

describe('normalizeBillStatus', () => {
  it('always returns a canonical status, whatever the input', () => {
    const inputs = [
      undefined, null, '', '   ', 'Introduced', 'total gibberish 12345',
      'Sponsor introductory remarks on measure.',
      ...POLLUTED_FROM_PRODUCTION.map(([text]) => text),
    ]
    for (const input of inputs) {
      const out = normalizeBillStatus(input as string | null | undefined)
      expect(isCanonicalStatus(out), `"${input}" produced "${out}"`).toBe(true)
    }
  })

  it('maps the exact strings that polluted production', () => {
    for (const [text, expected] of POLLUTED_FROM_PRODUCTION) {
      expect(normalizeBillStatus(text), text).toBe(expected)
    }
  })

  it('treats a non-empty laws array as enacted regardless of action text', () => {
    expect(normalizeBillStatus('Referred to the House Committee on Ways and Means.', [{ number: '119-1' }]))
      .toBe('enacted')
  })

  it('falls back to introduced for empty input, not to raw text', () => {
    expect(normalizeBillStatus('')).toBe('introduced')
    expect(normalizeBillStatus(null)).toBe('introduced')
    expect(normalizeBillStatus(undefined)).toBe('introduced')
  })

  it('prefers the later stage when several keywords appear', () => {
    // A bill that became law still mentions its committee history.
    expect(normalizeBillStatus('Referred to committee. Passed House. Became Public Law No: 119-2.'))
      .toBe('enacted')
    expect(normalizeBillStatus('Passed House. Passed Senate.')).toBe('passed_both')
  })

  it('is case-insensitive', () => {
    expect(normalizeBillStatus('BECAME PUBLIC LAW NO: 119-4.')).toBe('enacted')
    expect(normalizeBillStatus('referred to the committee on finance')).toBe('in_committee')
  })
})

describe('status labels', () => {
  it('every canonical status has a display label', () => {
    // Guards the bug where `resolving_differences` had no label in any of the
    // three files that defined one, so it silently rendered as "Introduced".
    for (const s of BILL_STATUSES) {
      expect(BILL_STATUS_LABELS[s], `no label for "${s}"`).toBeDefined()
      expect(BILL_STATUS_LABELS[s].label.length).toBeGreaterThan(0)
      expect(BILL_STATUS_LABELS[s].cls.length).toBeGreaterThan(0)
    }
  })

  it('has no label for a status that does not exist', () => {
    expect(Object.keys(BILL_STATUS_LABELS).sort()).toEqual([...BILL_STATUSES].sort())
  })

  it('does not claim a chamber it cannot know', () => {
    // passed_chamber applies to House AND Senate bills; labelling it
    // "Passed House" mislabelled every Senate bill that passed the Senate.
    expect(BILL_STATUS_LABELS.passed_chamber.label).not.toMatch(/house|senate/i)
  })
})

describe('stage groups', () => {
  it('every canonical status belongs to exactly one stage', () => {
    // If a new status is added without a stage, its bills would vanish from
    // all three tabs on /bills — invisible, with no error.
    for (const s of BILL_STATUSES) {
      const hits = Object.values(STAGE_GROUPS).filter(g => g.includes(s))
      expect(hits.length, `"${s}" appears in ${hits.length} stage groups`).toBe(1)
    }
  })

  it('stage groups contain only canonical statuses', () => {
    for (const group of Object.values(STAGE_GROUPS)) {
      for (const s of group) expect(isCanonicalStatus(s)).toBe(true)
    }
  })

  it('resolves known stages and rejects unknown ones', () => {
    expect(statusesForStage('law')).toEqual(['enacted'])
    expect(statusesForStage('pending')).toContain('in_committee')
    expect(statusesForStage('passed')).toContain('passed_chamber')
    expect(statusesForStage('nonsense')).toBeNull()
    expect(statusesForStage(undefined)).toBeNull()
  })
})

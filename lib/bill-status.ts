/**
 * Single source of truth for a bill's legislative stage.
 *
 * There were three writers with three behaviours: sync-bills normalized with
 * one rule set, billService with a slightly different one, and sync-voted-bills
 * wrote the RAW latest-action text straight into the column
 * (`const status = latestActionText ?? 'Introduced'`). That polluted 76 rows
 * with values like "Became Public Law No: 119-50." and "Received in the Senate
 * and Read twice and referred to the Committee on Finance." — 10 of which were
 * actual enacted laws that no status filter could ever find.
 *
 * Every writer must go through normalizeBillStatus().
 */

export const BILL_STATUSES = [
  'introduced',
  'in_committee',
  'reported',
  'passed_chamber',
  'passed_both',
  'resolving_differences',
  'enacted',
] as const

export type BillStatus = (typeof BILL_STATUSES)[number]

export function isCanonicalStatus(s: string | null | undefined): s is BillStatus {
  return !!s && (BILL_STATUSES as readonly string[]).includes(s)
}

/**
 * Derive the stage from Congress.gov's latest-action text. Order matters:
 * later stages are checked first, because a bill that became law also mentions
 * earlier steps in its history.
 */
export function normalizeBillStatus(
  latestActionText?: string | null,
  laws?: unknown[] | null,
): BillStatus {
  if (laws && laws.length > 0) return 'enacted'

  const t = (latestActionText || '').toLowerCase()
  if (!t) return 'introduced'

  if (t.includes('became public law') || t.includes('signed by president')) return 'enacted'
  if (t.includes('passed senate') && t.includes('passed house')) return 'passed_both'
  if (t.includes('resolving differences') || t.includes('conference')) return 'resolving_differences'
  if (
    t.includes('passed senate') || t.includes('passed house') ||
    t.includes('passed/agreed to in house') || t.includes('passed/agreed to in senate') ||
    t.includes('held at the desk') || t.includes('received in the senate') ||
    t.includes('received in the house')
  ) return 'passed_chamber'
  if (
    t.includes('reported') || t.includes('placed on senate legislative calendar') ||
    t.includes('placed on the union calendar') || t.includes('placed on the house calendar')
  ) return 'reported'
  if (
    t.includes('referred to') || t.includes('committee') ||
    t.includes('hearing') || t.includes('subcommittee')
  ) return 'in_committee'

  return 'introduced'
}

/**
 * Display labels — the single source. These were previously redefined in three
 * files, which had already drifted: TrackedBills labelled `passed_chamber` as
 * "Passed House", so a Senate bill that passed the SENATE was captioned
 * "Passed House". None of the three had a label for `resolving_differences`,
 * so that bill silently rendered as "Introduced".
 */
export const BILL_STATUS_LABELS: Record<BillStatus, { label: string; cls: string }> = {
  enacted:               { label: 'Enacted',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  passed_both:           { label: 'Passed Both',     cls: 'bg-green-50 text-green-700 border-green-200' },
  resolving_differences: { label: 'In Conference',   cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  passed_chamber:        { label: 'Passed Chamber',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  reported:              { label: 'Reported',        cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_committee:          { label: 'In Committee',    cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  introduced:            { label: 'Introduced',      cls: 'bg-gray-50 text-gray-600 border-gray-200' },
}

/**
 * Coarse grouping for the bills page: has this bill actually advanced, or is it
 * still one of the many thousands that were merely introduced? Most bills never
 * leave committee, so lumping "introduced" together with "passed the House" hides
 * the distinction that matters most to a reader.
 */
export const STAGE_GROUPS = {
  pending: ['introduced', 'in_committee', 'reported'] as BillStatus[],
  passed: ['passed_chamber', 'passed_both', 'resolving_differences'] as BillStatus[],
  law: ['enacted'] as BillStatus[],
}

export type StageKey = keyof typeof STAGE_GROUPS

export function statusesForStage(stage: string | null | undefined): BillStatus[] | null {
  if (!stage) return null
  return STAGE_GROUPS[stage as StageKey] ?? null
}

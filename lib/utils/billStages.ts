/**
 * Helpers for figuring out where a bill is in the legislative process.
 *
 * The 6 canonical stages match Bill.status values, in order:
 *   1. introduced
 *   2. in_committee
 *   3. reported
 *   4. passed_chamber
 *   5. passed_both
 *   6. enacted
 *
 * Each stage has a human label, a short description, who's typically involved,
 * and (when computable from bill data) the date and a more specific "who".
 */

export type StageKey =
  | 'introduced'
  | 'in_committee'
  | 'reported'
  | 'passed_chamber'
  | 'passed_both'
  | 'enacted'

export interface Stage {
  key: StageKey
  label: string
  /** Plain-English description of what this stage means */
  description: string
  /** Generic description of who acts at this stage */
  whoActs: string
}

export const STAGES: Stage[] = [
  {
    key: 'introduced',
    label: 'Introduced',
    description: 'Bill is filed in its originating chamber and assigned a number.',
    whoActs: 'The bill\'s sponsor (and any co-sponsors who sign on at introduction)',
  },
  {
    key: 'in_committee',
    label: 'In Committee',
    description: 'Referred to one or more standing committees for review, hearings, and possible markup.',
    whoActs: 'Members of the committee(s) the bill was referred to',
  },
  {
    key: 'reported',
    label: 'Reported',
    description: 'Committee has approved the bill (usually with amendments) and sent it back to the full chamber.',
    whoActs: 'Full chamber floor — Speaker / Majority Leader controls scheduling',
  },
  {
    key: 'passed_chamber',
    label: 'Passed One Chamber',
    description: 'Originating chamber has voted to pass. Sent to the other chamber.',
    whoActs: 'The other chamber (Senate or House) repeats the committee + floor-vote process',
  },
  {
    key: 'passed_both',
    label: 'Passed Both Chambers',
    description: 'Both House and Senate have passed the bill. Any differences must be reconciled before it goes to the President.',
    whoActs: 'Conference committee (if versions differ), then the President',
  },
  {
    key: 'enacted',
    label: 'Enacted',
    description: 'Signed into law by the President (or passed over a veto). Now public law.',
    whoActs: 'No further legislative action — the executive branch implements',
  },
]

export const STAGE_ORDER: Record<StageKey, number> = {
  introduced: 0,
  in_committee: 1,
  reported: 2,
  passed_chamber: 3,
  passed_both: 4,
  enacted: 5,
}

/**
 * Parse a bill's `actions` JSON (from Congress.gov) to extract the date each
 * stage was reached, plus any committee names mentioned. Best-effort — actions
 * vary widely in wording.
 */
export interface StageHistory {
  reachedAt: Date | null
  committees: string[]
}

export function parseStageHistory(actions: unknown): Record<StageKey, StageHistory> {
  const empty: StageHistory = { reachedAt: null, committees: [] }
  const history: Record<StageKey, StageHistory> = {
    introduced:     { reachedAt: null, committees: [] },
    in_committee:   { reachedAt: null, committees: [] },
    reported:       { reachedAt: null, committees: [] },
    passed_chamber: { reachedAt: null, committees: [] },
    passed_both:    { reachedAt: null, committees: [] },
    enacted:        { reachedAt: null, committees: [] },
  }

  if (!Array.isArray(actions)) return history

  // Sort actions oldest → newest so the first occurrence of each stage wins
  const sorted = [...actions]
    .map(a => ({ ...a, _date: a.actionDate ? new Date(a.actionDate) : null }))
    .sort((a, b) => (a._date?.getTime() ?? 0) - (b._date?.getTime() ?? 0))

  let chamberPassedCount = 0

  for (const a of sorted) {
    const text = String(a.text ?? '').toLowerCase()
    const date = a._date instanceof Date && !isNaN(a._date.getTime()) ? a._date : null

    if (!history.introduced.reachedAt && (text.includes('introduced') || text.includes('referred'))) {
      history.introduced.reachedAt = date
    }
    if (text.includes('referred to')) {
      const m = a.text?.match(/referred to (?:the )?(.+?)(?:\.|$)/i)
      if (m?.[1]) {
        const committee = m[1].trim().replace(/^the\s+/i, '')
        if (!history.in_committee.committees.includes(committee)) {
          history.in_committee.committees.push(committee)
        }
      }
      if (!history.in_committee.reachedAt) history.in_committee.reachedAt = date
    }
    if (!history.reported.reachedAt && text.includes('reported')) {
      history.reported.reachedAt = date
    }
    if (text.includes('passed senate') || text.includes('passed house') ||
        text.includes('passed/agreed to in senate') || text.includes('passed/agreed to in house')) {
      chamberPassedCount++
      if (!history.passed_chamber.reachedAt) history.passed_chamber.reachedAt = date
      if (chamberPassedCount >= 2 && !history.passed_both.reachedAt) {
        history.passed_both.reachedAt = date
      }
    }
    if (!history.enacted.reachedAt && (
      text.includes('became public law') ||
      text.includes('signed by president') ||
      text.includes('became law')
    )) {
      history.enacted.reachedAt = date
    }
  }

  return history
}

/**
 * Compute the next-action info: which stage comes next, and a sentence about
 * who's expected to act there. Returns null when the bill is already enacted.
 */
export function nextAction(currentStatus: StageKey, history: Record<StageKey, StageHistory>): {
  next: Stage
  whoActs: string
} | null {
  const currentIdx = STAGE_ORDER[currentStatus]
  if (currentIdx >= STAGES.length - 1) return null // already enacted

  const next = STAGES[currentIdx + 1]

  // Customize "whoActs" for the most informative cases when we have data
  let whoActs = next.whoActs
  if (next.key === 'reported') {
    const committees = history.in_committee.committees
    if (committees.length === 1) {
      whoActs = `${committees[0]} — must vote to report the bill out`
    } else if (committees.length > 1) {
      whoActs = `Committees: ${committees.join('; ')}`
    }
  }

  return { next, whoActs }
}

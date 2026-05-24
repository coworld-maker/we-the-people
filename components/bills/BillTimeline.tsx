'use client'

import { useMemo, useState } from 'react'
import { Check, Circle, ArrowRight, Calendar, Users } from 'lucide-react'
import {
  STAGES, STAGE_ORDER, parseStageHistory, nextAction,
  type StageKey,
} from '@/lib/utils/billStages'

interface Sponsor {
  bioguideId?: string
  firstName?: string
  lastName?: string
  party?: string
  state?: string
}

interface Props {
  status: string                  // current Bill.status
  actions: unknown                // Bill.actions JSON (array of {text, actionDate, ...})
  sponsors: Sponsor[] | null
  cosponsors?: Sponsor[] | null
  introducedDate: Date | string
  originChamber: string
}

function fmtDate(d: Date | string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function partyAccent(party?: string): string {
  if (party === 'R') return 'text-red-600'
  if (party === 'D') return 'text-blue-600'
  if (party === 'I') return 'text-purple-600'
  return 'text-[--text-muted]'
}

export default function BillTimeline({
  status, actions, sponsors, cosponsors, introducedDate, originChamber,
}: Props) {
  const safeStatus = (STAGE_ORDER[status as StageKey] !== undefined ? status : 'introduced') as StageKey
  const currentIdx = STAGE_ORDER[safeStatus]
  const history = useMemo(() => parseStageHistory(actions), [actions])
  const next = useMemo(() => nextAction(safeStatus, history), [safeStatus, history])

  // Default the user's expanded stage to the current one
  const [selected, setSelected] = useState<StageKey>(safeStatus)
  const selectedIdx = STAGE_ORDER[selected]
  const selectedStage = STAGES[selectedIdx]

  // Who's involved at the selected stage
  function detailsForStage(key: StageKey) {
    if (key === 'introduced') {
      return {
        date: history.introduced.reachedAt ?? new Date(introducedDate),
        title: 'Sponsor & co-sponsors',
        body: (
          <>
            {sponsors && sponsors.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider mb-1.5">
                  Sponsor
                </p>
                {sponsors.map((s, i) => (
                  <p key={i} className="text-sm text-[--text]">
                    <span className="font-semibold">{s.firstName} {s.lastName}</span>
                    {' '}
                    <span className={`text-xs ${partyAccent(s.party)}`}>({s.party}-{s.state})</span>
                  </p>
                ))}
              </div>
            )}
            {cosponsors && cosponsors.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider mb-1.5">
                  Co-sponsors ({cosponsors.length})
                </p>
                <p className="text-xs text-[--text-secondary] leading-relaxed">
                  {cosponsors.slice(0, 6).map(s => `${s.firstName?.[0]}. ${s.lastName} (${s.party})`).join(', ')}
                  {cosponsors.length > 6 && ` + ${cosponsors.length - 6} more`}
                </p>
              </div>
            )}
            <p className="text-xs text-[--text-muted] mt-3">
              Filed in the <span className="font-semibold text-[--text]">{originChamber}</span>.
            </p>
          </>
        ),
      }
    }
    if (key === 'in_committee') {
      const committees = history.in_committee.committees
      return {
        date: history.in_committee.reachedAt,
        title: 'Committee referral',
        body: (
          <>
            {committees.length > 0 ? (
              <ul className="space-y-1.5">
                {committees.map((c, i) => (
                  <li key={i} className="text-sm text-[--text] flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 text-[--accent] mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[--text-muted]">Specific committees not parsed from action data.</p>
            )}
            <p className="text-xs text-[--text-muted] mt-3">
              The committee may hold hearings, amend the bill, or let it die without action.
            </p>
          </>
        ),
      }
    }
    if (key === 'reported') {
      return {
        date: history.reported.reachedAt,
        title: 'Reported out of committee',
        body: (
          <p className="text-sm text-[--text-secondary]">
            The committee voted to send the bill to the floor of the full chamber.
            The {originChamber === 'House' ? 'Speaker of the House' : 'Senate Majority Leader'} schedules a floor vote.
          </p>
        ),
      }
    }
    if (key === 'passed_chamber') {
      return {
        date: history.passed_chamber.reachedAt,
        title: 'Passed one chamber',
        body: (
          <p className="text-sm text-[--text-secondary]">
            The {originChamber} voted to pass the bill. It now moves to the {originChamber === 'House' ? 'Senate' : 'House'},
            which repeats the committee referral and floor-vote process.
          </p>
        ),
      }
    }
    if (key === 'passed_both') {
      return {
        date: history.passed_both.reachedAt,
        title: 'Passed both chambers',
        body: (
          <p className="text-sm text-[--text-secondary]">
            Both chambers have passed the bill. If the two versions differ, a conference committee
            reconciles them. Once both chambers agree on identical text, it goes to the President.
          </p>
        ),
      }
    }
    // enacted
    return {
      date: history.enacted.reachedAt,
      title: 'Signed into law',
      body: (
        <p className="text-sm text-[--text-secondary]">
          The President signed the bill into law (or Congress overrode a veto).
          It's now public law and federal agencies will implement it.
        </p>
      ),
    }
  }

  const details = detailsForStage(selected)

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border]">
        <h2 className="font-display text-sm font-bold text-[--text]">Path to becoming law</h2>
      </div>

      {/* ── Horizontal stepper ─────────────────────────────────────────── */}
      <div className="px-3 sm:px-5 pt-5 pb-4 overflow-x-auto">
        <ol className="flex items-start justify-between gap-1 min-w-[640px] relative">
          {/* Progress line behind the dots */}
          <span
            className="absolute top-3 left-3 right-3 h-0.5 bg-[--border]"
            aria-hidden="true"
          />
          <span
            className="absolute top-3 left-3 h-0.5 bg-[--accent] transition-all"
            style={{ width: `calc((100% - 1.5rem) * ${currentIdx / (STAGES.length - 1)})` }}
            aria-hidden="true"
          />

          {STAGES.map((stage, i) => {
            const done = i < currentIdx
            const current = i === currentIdx
            const upcoming = i > currentIdx
            const stageHistory = history[stage.key]
            const isSelected = selected === stage.key

            return (
              <li key={stage.key} className="flex-1 relative">
                <button
                  onClick={() => setSelected(stage.key)}
                  className="w-full flex flex-col items-center group"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 transition-all border-2 ${
                      done    ? 'bg-[--accent] border-[--accent] text-white'
                    : current ? 'bg-[--surface] border-[--accent] ring-4 ring-[--accent]/15'
                    :           'bg-[--surface] border-[--border]'
                    } ${isSelected && !done && !current ? 'border-[--accent]/60' : ''}`}
                  >
                    {done && <Check className="w-3.5 h-3.5" />}
                    {current && <Circle className="w-2 h-2 fill-[--accent] text-[--accent]" />}
                    {upcoming && <span className="text-[10px] font-bold text-[--text-muted]">{i + 1}</span>}
                  </span>
                  <span className={`mt-2 text-[10px] sm:text-[11px] font-semibold text-center leading-tight transition-colors ${
                    current  ? 'text-[--accent]'
                  : done     ? 'text-[--text]'
                  :            'text-[--text-muted]'
                  } ${isSelected ? 'underline underline-offset-2' : ''}`}>
                    {stage.label}
                  </span>
                  {stageHistory.reachedAt && (
                    <span className="mt-0.5 text-[9px] text-[--text-muted] tabular-nums">
                      {fmtDate(stageHistory.reachedAt)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {/* ── Selected-stage details ─────────────────────────────────────── */}
      <div className="px-5 pb-5 pt-2 border-t border-[--border] bg-[--surface-secondary]/40">
        <div className="flex items-center gap-2 mb-2 mt-3">
          <h3 className="font-display text-sm font-bold text-[--text]">
            {STAGES[selectedIdx].label} — {details.title}
          </h3>
          {details.date && (
            <span className="text-[10px] text-[--text-muted] flex items-center gap-0.5">
              <Calendar className="w-3 h-3" /> {fmtDate(details.date)}
            </span>
          )}
        </div>
        <p className="text-xs text-[--text-secondary] mb-3 leading-relaxed">
          {selectedStage.description}
        </p>
        {details.body}
      </div>

      {/* ── Next action banner (only when bill isn't already enacted) ──── */}
      {next && (
        <div className="px-5 py-3 border-t border-[--border] bg-[--accent-light]/30 flex items-start gap-2.5">
          <ArrowRight className="w-3.5 h-3.5 text-[--accent] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[--text]">
              Next: {next.next.label}
            </p>
            <p className="text-[11px] text-[--text-secondary] leading-relaxed mt-0.5">
              {next.whoActs}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

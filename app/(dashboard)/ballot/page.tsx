/**
 * /ballot — pick a state, land on its Nov 3 federal races. Public and
 * indexable: the per-state pages are what people search for in the closing
 * weeks, and this is the hub that links them.
 */

import Link from 'next/link'
import { Vote, ArrowRight } from 'lucide-react'
import { ABBR_TO_NAME } from '@/lib/utils/state-codes'
import { daysUntilElection } from '@/lib/data/ballot'

export const metadata = {
  title: 'What’s on your ballot',
  description:
    'The federal races each state votes on November 3, 2026 — U.S. House seats, Senate races and governors — with links to official state election information.',
}

export default function BallotIndexPage() {
  const days = daysUntilElection()
  const states = Object.entries(ABBR_TO_NAME).sort((a, b) => a[1].localeCompare(b[1]))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="hero-gradient rounded-2xl px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-2 mb-1">
          <Vote className="w-5 h-5 text-white/80" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {days > 0 ? `${days} days away` : 'Election day'}
          </span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white mb-2">
          What&rsquo;s on your ballot
        </h1>
        <p className="text-sm text-white/75">
          Pick your state for the federal races it votes on November 3, 2026, and where to find your
          official ballot.
        </p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {states.map(([code, name]) => (
            <Link
              key={code}
              href={`/ballot/${code.toLowerCase()}`}
              className="flex items-center justify-between gap-1 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-[--text-secondary] hover:bg-[--surface-secondary] hover:text-[--accent] transition-colors group"
            >
              {name}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-[--text-muted] text-center px-4">
        Federal races only. Your actual ballot also carries state and local contests — your state
        election office has the full list.
      </p>
    </div>
  )
}

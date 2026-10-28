/**
 * /states — index of the per-state pages.
 *
 * The breadcrumb on /states/[code] has always linked here, but the page never
 * existed, so that link 404'd. It also gives search engines (and readers) one
 * place that lists every state page.
 */

import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { ABBR_TO_NAME } from '@/lib/utils/state-codes'

export const metadata = {
  title: 'States',
  description:
    'How people in each state are voting on federal bills, the bills that matter most there, and that state’s delegation in Congress.',
}

export default function StatesIndexPage() {
  const states = Object.entries(ABBR_TO_NAME).sort((a, b) => a[1].localeCompare(b[1]))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="hero-gradient rounded-2xl px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-white/80" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">By state</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white mb-2">States</h1>
        <p className="text-sm text-white/75">
          The bills people in each state care about, that state&rsquo;s delegation, and how its
          members have voted.
        </p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {states.map(([code, name]) => (
            <Link
              key={code}
              href={`/states/${code.toLowerCase()}`}
              className="flex items-center justify-between gap-1 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-[--text-secondary] hover:bg-[--surface-secondary] hover:text-[--accent] transition-colors group"
            >
              {name}
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-[--text-muted] text-center px-4">
        Looking for what you vote on this November?{' '}
        <Link href="/ballot" className="text-[--accent] hover:underline">See your ballot by state</Link>.
      </p>
    </div>
  )
}

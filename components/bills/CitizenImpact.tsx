'use client'

import { Users, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  totalVotes: number
  billId: string
}

const STEPS = [
  {
    icon: Users,
    title: 'Citizens vote & comment',
    body: 'Public opinion data is aggregated and updated in real time.',
  },
  {
    icon: TrendingUp,
    title: 'Patterns become visible',
    body: 'Representatives can see constituent sentiment broken down by district.',
  },
  {
    icon: MessageSquare,
    title: 'Your voice on the record',
    body: 'Contact your rep directly — one constituent call can shift a staffer\'s priority list.',
  },
]

function plural(n: number, word: string) {
  return `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`
}

export default function CitizenImpact({ totalVotes, billId }: Props) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[--border] flex items-center gap-2">
        <Users className="w-4 h-4 text-[--accent] shrink-0" />
        <h3 className="font-display text-sm font-bold text-[--text]">Does this make a difference?</h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Social proof headline */}
        <div className="rounded-xl bg-[--accent]/5 border border-[--accent]/15 px-4 py-3 text-center">
          {totalVotes > 0 ? (
            <>
              <p className="text-2xl font-extrabold text-[--accent] leading-none">
                {totalVotes.toLocaleString()}
              </p>
              <p className="text-xs text-[--text-secondary] mt-1">
                {totalVotes === 1 ? 'citizen has' : 'citizens have'} voted on this bill
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[--text]">Be the first to weigh in</p>
              <p className="text-xs text-[--text-muted] mt-0.5">Your vote starts the conversation</p>
            </>
          )}
        </div>

        {/* How it works */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] mb-3">How citizen engagement works</p>
          <ol className="space-y-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-[--accent]/10 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-[--accent]" />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px flex-1 bg-[--border] min-h-[12px]" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-semibold text-[--text] leading-snug">{step.title}</p>
                    <p className="text-xs text-[--text-muted] mt-0.5 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Real impact footnote */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Research shows</span> that constituent contacts — especially calls — are among the most effective ways to influence a legislator's position on active bills.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="#vote"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[--accent] text-white text-xs font-semibold hover:bg-[--accent-dark] transition-colors"
          onClick={e => {
            e.preventDefault()
            document.querySelector('#vote')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        >
          Cast your vote
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

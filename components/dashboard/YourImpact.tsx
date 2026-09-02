'use client'

import { useEffect, useState, useRef } from 'react'

interface ImpactStats {
  /** null = not enough overlap to compute. Render an empty state, never 0%. */
  alignmentPct: number | null
  alignmentMatched: number
  alignmentOverlap: number
  userState: string | null
  billsVotedOn: number
  communityDiscussions: number
}

function AnimatedDonut({ percentage }: { percentage: number }) {
  const [animPct, setAnimPct] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const duration = 1200
    const steps = 60
    const increment = percentage / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= percentage) {
        setAnimPct(percentage)
        clearInterval(timer)
      } else {
        setAnimPct(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [percentage])

  const radius = 70
  const stroke = 12
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animPct / 100) * circumference

  // Color based on percentage
  const color = animPct >= 70 ? '#22C55E' : animPct >= 40 ? '#F5A623' : '#E5484D'

  return (
    <div className="relative w-[160px] h-[160px] mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle cx="80" cy="80" r={radius}
          fill="none" stroke="var(--surface-tertiary)" strokeWidth={stroke} />
        {/* Progress ring */}
        <circle cx="80" cy="80" r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold text-[--text]">{animPct}%</span>
      </div>
    </div>
  )
}

export default function YourImpact({ stats }: { stats: ImpactStats }) {
  const hasAlignment = stats.alignmentPct !== null

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border]">
        <h2 className="font-display text-base font-bold text-[--text]">Your record</h2>
      </div>
      <div className="p-6">
        {/* Agreement. Only rendered when there is real overlap to compute it
            from — a user who has not voted has UNDEFINED agreement, not 0%,
            and a 0% donut in red would be an accusation the data cannot make. */}
        {hasAlignment ? (
          <>
            <AnimatedDonut percentage={stats.alignmentPct as number} />
            <p className="text-center text-sm text-[--text-secondary] mt-2">
              Agreement with your{stats.userState ? ` ${stats.userState}` : ''} delegation
            </p>
            <p className="text-center text-xs text-[--text-muted] mt-1 mb-6">
              {stats.alignmentMatched} of {stats.alignmentOverlap} recorded votes match
            </p>
          </>
        ) : (
          <div className="text-center py-6 mb-4 border border-dashed border-[--border] rounded-[--radius]">
            <p className="text-sm text-[--text-secondary]">Not enough overlap yet</p>
            <p className="text-xs text-[--text-muted] mt-1.5 px-4 leading-relaxed">
              Agreement needs bills where you voted <em>and</em> your delegation has a recorded
              roll call. Vote on a few more and it will appear here.
            </p>
          </div>
        )}

        {/* Counts of things the user actually did. "Bills you've influenced"
            was this same vote count — casting an opinion vote here does not
            influence a bill, and a "Representative contacts" row sat beside it
            hardcoded to 0, styled identically to a measurement. */}
        <div className="space-y-0 divide-y divide-[--border]">
          {[
            { label: 'Bills you\'ve voted on:', value: stats.billsVotedOn },
            { label: 'Community discussions:', value: stats.communityDiscussions },
          ].map(stat => (
            <div key={stat.label} className="flex items-center justify-between py-3.5">
              <span className="text-sm text-[--text-secondary]">{stat.label}</span>
              <span className="font-display text-lg font-extrabold text-[--text]">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

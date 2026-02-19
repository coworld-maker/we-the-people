'use client'

import { useEffect, useState, useRef } from 'react'

interface ImpactStats {
  alignmentPct: number
  billsInfluenced: number
  communityDiscussions: number
  representativeContacts: number
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
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border]">
        <h2 className="font-display text-base font-bold text-[--text]">Your Impact</h2>
      </div>
      <div className="p-6">
        {/* Donut */}
        <AnimatedDonut percentage={stats.alignmentPct} />
        <p className="text-center text-sm text-[--text-secondary] mt-2 mb-6">Voting Alignment</p>

        {/* Stats */}
        <div className="space-y-0 divide-y divide-[--border]">
          {[
            { label: 'Bills you\'ve influenced:', value: stats.billsInfluenced },
            { label: 'Community discussions:', value: stats.communityDiscussions },
            { label: 'Representative contacts:', value: stats.representativeContacts },
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

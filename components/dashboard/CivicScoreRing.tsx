'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

interface Props {
  score: number
  level: { name: string; emoji: string; color: string; min: number; max: number }
  nextLevel: { name: string; min: number } | null
  progressToNext: number
  streak: number
}

export default function CivicScoreRing({ score, level, nextLevel, progressToNext, streak }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const inc = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += inc
      if (current >= score) { setAnimatedScore(score); clearInterval(timer) }
      else setAnimatedScore(Math.round(current))
    }, duration / steps)
    setTimeout(() => setAnimatedProgress(progressToNext), 150)
    return () => clearInterval(timer)
  }, [score, progressToNext])

  const radius = 58
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedProgress / 100) * circumference

  return (
    <div className="card p-6">
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--surface-tertiary)" strokeWidth="8" />
            <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-extrabold text-[--text]">{animatedScore}</span>
            <span className="text-[10px] text-[--text-muted] font-semibold uppercase tracking-wider">XP</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[--text-muted] uppercase tracking-wider mb-1">Civic level</p>
          <h3 className="font-display text-lg font-bold text-[--text] flex items-center gap-2">
            {level.emoji} {level.name}
          </h3>
          {nextLevel ? (
            <p className="text-sm text-[--text-secondary] mt-1">
              {nextLevel.min - score} XP to <span className="font-semibold">{nextLevel.name}</span>
            </p>
          ) : (
            <p className="text-sm text-[--success] font-medium mt-1">Maximum level</p>
          )}

          <div className="flex items-center gap-4 mt-4">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-amber-600">
                <Flame className="w-4 h-4" />
                <span className="font-semibold">{streak}-day streak</span>
              </div>
            )}
            <div className="text-xs text-[--text-muted]">
              20 XP / vote · 10 XP / comment
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

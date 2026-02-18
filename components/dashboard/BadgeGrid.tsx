'use client'

import { Lock } from 'lucide-react'

interface Badge { id: string; name: string; emoji: string; desc: string; earned: boolean }

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  const earned = badges.filter(b => b.earned).length

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-[--text]">Badges</h3>
        <span className="text-xs font-semibold text-[--accent]">{earned} of {badges.length} earned</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {badges.map(badge => (
            <div key={badge.id}
              className={`group relative flex flex-col items-center p-3 rounded-lg text-center transition-all ${
                badge.earned
                  ? 'bg-[--accent-light] border border-[--accent]/20'
                  : 'bg-[--surface-secondary] border border-[--border] opacity-50'
              }`}
              title={badge.desc}
            >
              <span className={`text-xl mb-1 ${badge.earned ? '' : 'grayscale'}`}>{badge.emoji}</span>
              <span className="text-[10px] font-semibold text-[--text] leading-tight">{badge.name}</span>
              {!badge.earned && (
                <Lock className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[--text-muted] bg-white rounded-full p-0.5" />
              )}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[--dark] text-white text-[10px] px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {badge.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

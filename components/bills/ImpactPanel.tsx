'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'

interface Impact {
  id: string; category: string; demographic: string; impactType: string
  shortDescription: string; detailedAnalysis: string; affectedGroups: string[]; confidence: number
}

export default function ImpactPanel({ impacts }: { impacts: Impact[] }) {
  const [expanded, setExpanded] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  if (!impacts || impacts.length === 0) return null

  const icons: Record<string, { Icon: any; color: string; bg: string; border: string }> = {
    positive: { Icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    negative: { Icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
    neutral: { Icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between border-b border-[--border] hover:bg-[--surface-secondary] transition-colors"
      >
        <h2 className="font-display text-sm font-bold text-[--text]">Impact analysis</h2>
        {expanded ? <ChevronUp className="w-4 h-4 text-[--text-muted]" /> : <ChevronDown className="w-4 h-4 text-[--text-muted]" />}
      </button>

      {expanded && (
        <div className="p-5 space-y-2">
          {impacts.map(imp => {
            const cfg = icons[imp.impactType] || icons.neutral
            const isOpen = openId === imp.id
            return (
              <div key={imp.id} className={`rounded-lg border ${cfg.border} overflow-hidden`}>
                <button onClick={() => setOpenId(isOpen ? null : imp.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left ${cfg.bg} hover:brightness-[0.97] transition-all`}
                >
                  <cfg.Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[--text]">{imp.demographic}</span>
                      <span className="text-[10px] text-[--text-muted]">{imp.confidence}% confidence</span>
                    </div>
                    <p className="text-sm text-[--text-secondary] mt-0.5">{imp.shortDescription}</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[--text-muted] shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-[--text-muted] shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-2 bg-white border-t border-[--border]">
                    <p className="text-sm text-[--text-secondary] leading-relaxed mb-3">{imp.detailedAnalysis}</p>
                    {imp.affectedGroups?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {imp.affectedGroups.map((g, i) => (
                          <span key={i} className="badge bg-[--surface-secondary] text-[--text-secondary] border border-[--border]">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

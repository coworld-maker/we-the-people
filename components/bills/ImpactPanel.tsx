'use client'

import { useState } from 'react'

interface Impact {
  id: string; category: string; demographic: string; impactType: string
  shortDescription: string; detailedAnalysis: string; affectedGroups: string[]; confidence: number
}

export default function ImpactPanel({ impacts }: { impacts: Impact[] }) {
  const [expanded, setExpanded] = useState(true)
  const [openImpact, setOpenImpact] = useState<string | null>(null)

  if (!impacts || impacts.length === 0) return null

  const typeConfig: Record<string, { emoji: string; bg: string; text: string; border: string }> = {
    positive: { emoji: '📈', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    negative: { emoji: '📉', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    neutral: { emoji: '➡️', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
      >
        <h2 className="font-display text-lg font-bold text-[#0F172A]">🎯 Impact Analysis</h2>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-6 space-y-3">
          {impacts.map(impact => {
            const tc = typeConfig[impact.impactType] || typeConfig.neutral
            const isOpen = openImpact === impact.id
            return (
              <div key={impact.id}
                className={`rounded-xl border ${tc.border} overflow-hidden transition-all`}
              >
                <button
                  onClick={() => setOpenImpact(isOpen ? null : impact.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left ${tc.bg} hover:brightness-95 transition-all`}
                >
                  <span className="text-lg">{tc.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-[#0F172A] text-sm">{impact.demographic}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${tc.bg} ${tc.text} border ${tc.border}`}>
                        {impact.impactType}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{impact.confidence}% confidence</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 font-body">{impact.shortDescription}</p>
                  </div>
                  <span className="text-gray-400 text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed font-body mb-3">{impact.detailedAnalysis}</p>
                    {impact.affectedGroups?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-gray-400 font-medium">Affected:</span>
                        {impact.affectedGroups.map((g, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">{g}</span>
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

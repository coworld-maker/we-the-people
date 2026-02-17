'use client'

import { useState } from 'react'
import { Target, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react'

interface ImpactItem {
  id: string
  category: string
  demographic: string | null
  impactType: string
  shortDescription: string
  detailedAnalysis: string
  affectedGroups: string[]
  confidence: number | null
}

interface ImpactPanelProps {
  impacts: ImpactItem[]
}

const impactIcons: Record<string, typeof TrendingUp> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
}

const impactColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  positive: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  negative: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  neutral: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
}

export default function ImpactPanel({ impacts }: ImpactPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  if (impacts.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold text-white">Who Does This Affect?</h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-white" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white" />
        )}
      </button>

      {expanded && (
        <div className="p-6 space-y-3">
          {impacts.map(impact => {
            const colors = impactColors[impact.impactType] || impactColors.neutral
            const Icon = impactIcons[impact.impactType] || Minus
            const isOpen = expandedItem === impact.id

            return (
              <div
                key={impact.id}
                className={`rounded-lg border ${colors.border} overflow-hidden transition-all`}
              >
                <button
                  onClick={() => setExpandedItem(isOpen ? null : impact.id)}
                  className={`w-full ${colors.bg} p-4 flex items-start gap-3 text-left`}
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${colors.badge}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {impact.demographic || impact.category}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.badge}`}>
                        {impact.impactType}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                        {impact.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {impact.shortDescription}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {impact.detailedAnalysis}
                    </p>
                    {impact.affectedGroups.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {impact.affectedGroups.map((group, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {impact.confidence && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Confidence:</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[100px]">
                          <div
                            className="h-1.5 bg-blue-400 rounded-full"
                            style={{ width: `${impact.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{impact.confidence}%</span>
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

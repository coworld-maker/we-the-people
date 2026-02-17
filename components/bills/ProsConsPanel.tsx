'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Tag } from 'lucide-react'

interface ProConItem {
  id: string
  type: string
  title: string
  description: string
  category: string | null
}

interface ProsConsPanelProps {
  prosCons: ProConItem[]
}

const categoryColors: Record<string, string> = {
  Economy: 'bg-blue-100 text-blue-700',
  Environment: 'bg-emerald-100 text-emerald-700',
  Healthcare: 'bg-pink-100 text-pink-700',
  Education: 'bg-indigo-100 text-indigo-700',
  Security: 'bg-red-100 text-red-700',
  Rights: 'bg-purple-100 text-purple-700',
  Infrastructure: 'bg-orange-100 text-orange-700',
  Other: 'bg-gray-100 text-gray-700',
}

export default function ProsConsPanel({ prosCons }: ProsConsPanelProps) {
  const [expanded, setExpanded] = useState(true)

  const pros = prosCons.filter(pc => pc.type === 'pro')
  const cons = prosCons.filter(pc => pc.type === 'con')

  if (pros.length === 0 && cons.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold text-white">Pros &amp; Cons</h2>
          <span className="text-sm text-green-100 ml-2">
            {pros.length} pros, {cons.length} cons
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-white" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white" />
        )}
      </button>

      {expanded && (
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pros */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-bold text-green-800">Arguments For</h3>
              </div>
              <div className="space-y-3">
                {pros.map(pro => (
                  <div
                    key={pro.id}
                    className="p-4 bg-green-50 border border-green-100 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {pro.title}
                      </h4>
                      {pro.category && (
                        <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[pro.category] || categoryColors.Other}`}>
                          {pro.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {pro.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-bold text-red-800">Arguments Against</h3>
              </div>
              <div className="space-y-3">
                {cons.map(con => (
                  <div
                    key={con.id}
                    className="p-4 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {con.title}
                      </h4>
                      {con.category && (
                        <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[con.category] || categoryColors.Other}`}>
                          {con.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {con.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

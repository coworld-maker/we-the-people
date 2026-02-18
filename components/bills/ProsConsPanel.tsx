'use client'

import { useState } from 'react'

interface ProCon {
  id: string; type: string; title: string; description: string; category: string; source: string
}

export default function ProsConsPanel({ prosCons }: { prosCons: ProCon[] }) {
  const [expanded, setExpanded] = useState(true)

  if (!prosCons || prosCons.length === 0) return null

  const pros = prosCons.filter(p => p.type === 'pro')
  const cons = prosCons.filter(p => p.type === 'con')

  const categoryColors: Record<string, string> = {
    Economy: 'bg-amber-50 text-amber-700', Environment: 'bg-emerald-50 text-emerald-700',
    Healthcare: 'bg-rose-50 text-rose-700', Education: 'bg-blue-50 text-blue-700',
    Security: 'bg-red-50 text-red-700', Rights: 'bg-violet-50 text-violet-700',
    Infrastructure: 'bg-orange-50 text-orange-700', Other: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
      >
        <h2 className="font-display text-lg font-bold text-[#0F172A]">⚖️ Arguments For &amp; Against</h2>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Pros */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👍</span>
              <h3 className="font-display font-bold text-emerald-600">Arguments For</h3>
            </div>
            <div className="space-y-4">
              {pros.map(p => (
                <div key={p.id} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-display font-bold text-[#0F172A] text-sm">{p.title}</h4>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${categoryColors[p.category] || categoryColors.Other}`}>
                      {p.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-body">{p.description}</p>
                </div>
              ))}
              {pros.length === 0 && <p className="text-sm text-gray-400 italic">No arguments for generated yet.</p>}
            </div>
          </div>

          {/* Cons */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👎</span>
              <h3 className="font-display font-bold text-red-500">Arguments Against</h3>
            </div>
            <div className="space-y-4">
              {cons.map(c => (
                <div key={c.id} className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-display font-bold text-[#0F172A] text-sm">{c.title}</h4>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${categoryColors[c.category] || categoryColors.Other}`}>
                      {c.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-body">{c.description}</p>
                </div>
              ))}
              {cons.length === 0 && <p className="text-sm text-gray-400 italic">No arguments against generated yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

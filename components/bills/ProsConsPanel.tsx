'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react'

interface ProCon { id: string; type: string; title: string; description: string; category: string; source: string }

export default function ProsConsPanel({ prosCons }: { prosCons: ProCon[] }) {
  const [expanded, setExpanded] = useState(true)
  if (!prosCons || prosCons.length === 0) return null

  const pros = prosCons.filter(p => p.type === 'pro')
  const cons = prosCons.filter(p => p.type === 'con')

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between border-b border-[--border] hover:bg-[--surface-secondary] transition-colors"
      >
        <h2 className="font-display text-sm font-bold text-[--text]">Arguments for &amp; against</h2>
        {expanded ? <ChevronUp className="w-4 h-4 text-[--text-muted]" /> : <ChevronDown className="w-4 h-4 text-[--text-muted]" />}
      </button>

      {expanded && (
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[--border]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display text-sm font-semibold text-emerald-700">In favor</h3>
            </div>
            <div className="space-y-3">
              {pros.map(p => (
                <div key={p.id} className="p-4 bg-emerald-50/60 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="text-sm font-semibold text-[--text]">{p.title}</h4>
                    <span className="badge bg-[--surface] text-[--text-secondary] border border-[--border] text-[10px]">{p.category}</span>
                  </div>
                  <p className="text-sm text-[--text-secondary] leading-relaxed">{p.description}</p>
                </div>
              ))}
              {pros.length === 0 && <p className="text-sm text-[--text-muted] italic">None generated yet.</p>}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <h3 className="font-display text-sm font-semibold text-red-600">Against</h3>
            </div>
            <div className="space-y-3">
              {cons.map(c => (
                <div key={c.id} className="p-4 bg-red-50/60 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="text-sm font-semibold text-[--text]">{c.title}</h4>
                    <span className="badge bg-[--surface] text-[--text-secondary] border border-[--border] text-[10px]">{c.category}</span>
                  </div>
                  <p className="text-sm text-[--text-secondary] leading-relaxed">{c.description}</p>
                </div>
              ))}
              {cons.length === 0 && <p className="text-sm text-[--text-muted] italic">None generated yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

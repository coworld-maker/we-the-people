'use client'

import { useState } from 'react'

interface BillFullTextProps { billId: string; initialText: string | null; congressGovUrl: string }

export default function BillFullText({ billId, initialText, congressGovUrl }: BillFullTextProps) {
  const [text, setText] = useState(initialText)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)

  async function handleToggle() {
    if (text) { setExpanded(!expanded); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${billId}/text`)
      const data = await res.json()
      if (data.text) { setText(data.text); setExpanded(true) }
      else setFallbackUrl(data.fallbackUrl || `${congressGovUrl}/text`)
    } catch { setFallbackUrl(`${congressGovUrl}/text`) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <button onClick={handleToggle} disabled={loading}
        className="w-full bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between hover:from-slate-800 hover:to-slate-900 transition-all"
      >
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          📜 {loading ? 'Loading...' : 'Full Bill Text'}
        </h2>
        {text ? <span className="text-white/60 text-sm">{expanded ? '▲' : '▼'}</span>
          : !loading ? <span className="text-sm text-slate-400 font-body">Click to load</span> : null}
      </button>

      {fallbackUrl && !text && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-800 mb-3 font-body">Full text is available on Congress.gov:</p>
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] font-display font-bold text-sm transition-colors"
          >🔗 Read on Congress.gov</a>
        </div>
      )}

      {text && expanded && (
        <div className="relative">
          <div className="sticky top-0 z-10 px-6 py-2.5 bg-gray-50 border-b flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium font-body">{text.length.toLocaleString()} characters</span>
            <a href={`${congressGovUrl}/text`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6366F1] font-semibold font-body">Congress.gov →</a>
          </div>
          <div className="px-6 py-6 max-h-[600px] overflow-y-auto bg-gray-50/30">
            <pre className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-gray-800">{text}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface Props {
  billId: string; aiSummary: string | null; officialSummary: string | null; aiAnalyzedAt: string | null
}

export default function AISummary({ billId, aiSummary, officialSummary, aiAnalyzedAt }: Props) {
  const [summary, setSummary] = useState(aiSummary)
  const [analyzedAt, setAnalyzedAt] = useState(aiAnalyzedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOfficial, setShowOfficial] = useState(false)

  async function handleAnalyze() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Analysis failed')
      window.location.reload()
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-sm font-bold text-[--text]">AI Summary</h2>
        </div>
        {analyzedAt && <span className="text-xs text-[--text-muted]">Analyzed {new Date(analyzedAt).toLocaleDateString()}</span>}
      </div>
      <div className="p-6">
        {summary ? (
          <>
            <p className="text-[15px] text-[--text-secondary] leading-relaxed whitespace-pre-line">{summary}</p>
            {officialSummary && (
              <div className="mt-4 pt-4 border-t border-[--border]">
                <button onClick={() => setShowOfficial(!showOfficial)}
                  className="flex items-center gap-1 text-sm text-[--accent] hover:text-[--accent-hover] font-medium transition-colors"
                >
                  {showOfficial ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Official summary
                </button>
                {showOfficial && (
                  <div className="mt-3 p-4 bg-[--surface-secondary] rounded-lg border border-[--border]">
                    <p className="text-sm text-[--text-secondary] leading-relaxed">{officialSummary}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 text-[--accent] mx-auto mb-3 opacity-50" />
            <h3 className="font-display text-base font-bold text-[--text] mb-1">Generate AI analysis</h3>
            <p className="text-sm text-[--text-muted] mb-5 max-w-sm mx-auto">
              Get a plain-language summary with balanced pros, cons, and impact analysis.
            </p>
            <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
              {loading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Generate analysis</>
              )}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left max-w-md mx-auto flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

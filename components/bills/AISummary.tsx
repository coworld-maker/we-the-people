'use client'

import { useState } from 'react'

interface AISummaryProps {
  billId: string; aiSummary: string | null; officialSummary: string | null; aiAnalyzedAt: string | null
}

export default function AISummary({ billId, aiSummary, officialSummary, aiAnalyzedAt }: AISummaryProps) {
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
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-amber-100">
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">✨ AI-Powered Summary</h2>
          {analyzedAt && (
            <span className="text-xs text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full font-body">
              {new Date(analyzedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="p-6">
        {summary ? (
          <>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px] font-body">{summary}</p>
            {officialSummary && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => setShowOfficial(!showOfficial)}
                  className="text-sm text-[#6366F1] hover:text-[#4F46E5] font-semibold transition-colors font-body"
                >
                  📄 {showOfficial ? 'Hide' : 'Show'} Official Summary
                </button>
                {showOfficial && (
                  <div className="mt-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-sm text-indigo-900 leading-relaxed font-body">{officialSummary}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="font-display text-lg font-bold text-[#0F172A] mb-2">Get an AI breakdown</h3>
            <p className="text-gray-400 text-sm mb-5 max-w-md mx-auto font-body">
              Plain-language summary, pros &amp; cons, and impact analysis — powered by AI.
            </p>
            <button onClick={handleAnalyze} disabled={loading}
              className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-amber-200 font-display font-bold text-sm disabled:opacity-50 transition-all hover:-translate-y-0.5"
            >
              {loading ? '⏳ Analyzing... (30-60s)' : '✨ Generate AI Analysis'}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left max-w-md mx-auto">
                <p className="text-sm text-red-700 font-body">⚠️ {error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

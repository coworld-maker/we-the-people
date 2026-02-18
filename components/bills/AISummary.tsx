'use client'

import { useState } from 'react'
import { Sparkles, Loader2, BookOpen, AlertCircle } from 'lucide-react'

interface AISummaryProps {
  billId: string
  aiSummary: string | null
  officialSummary: string | null
  aiAnalyzedAt: string | null
}

export default function AISummary({ billId, aiSummary, officialSummary, aiAnalyzedAt }: AISummaryProps) {
  const [summary, setSummary] = useState(aiSummary)
  const [analyzedAt, setAnalyzedAt] = useState(aiAnalyzedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOfficial, setShowOfficial] = useState(false)

  async function handleAnalyze() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Analysis failed')
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-amber-100">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">AI-Powered Summary</h2>
          </div>
          {analyzedAt && (
            <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
              Analyzed {new Date(analyzedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {summary ? (
          <>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line text-[15px]">{summary}</p>
            {officialSummary && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowOfficial(!showOfficial)}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  {showOfficial ? 'Hide' : 'Show'} Official Congress Summary
                </button>
                {showOfficial && (
                  <div className="mt-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-900 leading-relaxed">{officialSummary}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get an AI-powered breakdown
            </h3>
            <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
              Generate a plain-language summary, pros &amp; cons, and impact analysis to understand this bill better.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 font-semibold transition-all disabled:opacity-60 shadow-lg shadow-amber-200"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing... (30-60s)</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate AI Analysis</>
              )}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-left max-w-md mx-auto">
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

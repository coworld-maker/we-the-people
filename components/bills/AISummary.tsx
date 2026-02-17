'use client'

import { useState } from 'react'
import { Sparkles, Loader2, BookOpen } from 'lucide-react'

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
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Analysis failed')
      }
      // Reload page to get fresh data
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">AI-Powered Summary</h2>
          </div>
          {analyzedAt && (
            <span className="text-xs text-amber-100">
              Analyzed {new Date(analyzedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {summary ? (
          <>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
              {summary}
            </p>

            {/* Toggle between AI and official summary */}
            {officialSummary && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => setShowOfficial(!showOfficial)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <BookOpen className="w-4 h-4" />
                  {showOfficial ? 'Hide' : 'Show'} Official Congress Summary
                </button>
                {showOfficial && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {officialSummary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              No AI analysis yet. Generate a plain-language summary, pros &amp; cons, and impact analysis.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-medium transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing... (30-60s)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Analysis
                </>
              )}
            </button>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

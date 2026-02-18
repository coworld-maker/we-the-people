'use client'

import { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Loader2, Download, ExternalLink } from 'lucide-react'

interface BillFullTextProps {
  billId: string
  initialText: string | null
  congressGovUrl: string
}

export default function BillFullText({ billId, initialText, congressGovUrl }: BillFullTextProps) {
  const [text, setText] = useState(initialText)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(!!initialText)

  async function handleFetchText() {
    if (text) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/text`)
      const data = await res.json()

      if (data.text) {
        setText(data.text)
        setExpanded(true)
        setFetched(true)
      } else {
        setError('Full text not available from Congress.gov for this bill.')
      }
    } catch (err: any) {
      setError('Failed to load bill text.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <button
        onClick={handleFetchText}
        disabled={loading}
        className="w-full bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4 flex items-center justify-between hover:from-slate-700 hover:to-slate-800 transition-all"
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <FileText className="w-5 h-5 text-white" />
          )}
          <h2 className="text-lg font-bold text-white">
            {loading ? 'Loading Full Text...' : 'Full Bill Text'}
          </h2>
          {text && (
            <span className="text-sm text-slate-300 ml-2">
              {text.length.toLocaleString()} characters
            </span>
          )}
        </div>
        {text ? (
          expanded ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )
        ) : !loading ? (
          <span className="text-sm text-slate-300">Click to load</span>
        ) : null}
      </button>

      {error && (
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-700">{error}</p>
            <a
              href={`${congressGovUrl}/text`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on Congress.gov
            </a>
          </div>
        </div>
      )}

      {text && expanded && (
        <div className="relative">
          {/* Toolbar */}
          <div className="sticky top-0 z-10 px-6 py-2 bg-gray-50 border-b flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Official legislative text from Congress.gov
            </span>
            <a
              href={`${congressGovUrl}/text`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-3 h-3" />
              View original
            </a>
          </div>

          {/* Text content */}
          <div className="px-6 py-6 max-h-[600px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-gray-800">
              {text}
            </pre>
          </div>

          {/* Fade overlay at bottom */}
          <div className="sticky bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  )
}

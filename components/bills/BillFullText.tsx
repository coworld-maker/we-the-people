'use client'

import { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react'

interface BillFullTextProps {
  billId: string
  initialText: string | null
  congressGovUrl: string
}

export default function BillFullText({ billId, initialText, congressGovUrl }: BillFullTextProps) {
  const [text, setText] = useState(initialText)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)

  async function handleToggle() {
    if (text) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${billId}/text`)
      const data = await res.json()

      if (data.text) {
        setText(data.text)
        setExpanded(true)
      } else {
        // No text available — set fallback URL
        setFallbackUrl(data.fallbackUrl || `${congressGovUrl}/text`)
      }
    } catch {
      setFallbackUrl(`${congressGovUrl}/text`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
      {/* Header */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className="w-full bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between hover:from-slate-800 hover:to-slate-900 transition-all"
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
        </div>
        {text ? (
          expanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />
        ) : !loading ? (
          <span className="text-sm text-slate-300">Click to load</span>
        ) : null}
      </button>

      {/* Fallback — direct link to Congress.gov */}
      {fallbackUrl && !text && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-800 mb-2">
            The full text is available directly on Congress.gov:
          </p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Read Full Text on Congress.gov
          </a>
        </div>
      )}

      {/* Text content */}
      {text && expanded && (
        <div className="relative">
          <div className="sticky top-0 z-10 px-6 py-2 bg-gray-50 border-b flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Official legislative text • {text.length.toLocaleString()} characters
            </span>
            <a
              href={`${congressGovUrl}/text`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <ExternalLink className="w-3 h-3" />
              Congress.gov
            </a>
          </div>
          <div className="px-6 py-6 max-h-[600px] overflow-y-auto bg-gray-50/50">
            <pre className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-gray-800">
              {text}
            </pre>
          </div>
          <div className="sticky bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  )
}

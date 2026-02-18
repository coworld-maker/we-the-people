'use client'

import { useState } from 'react'
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface Props { billId: string; initialText: string | null; congressGovUrl: string }

export default function BillFullText({ billId, initialText, congressGovUrl }: Props) {
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
    <div className="card overflow-hidden">
      <button onClick={handleToggle} disabled={loading}
        className="w-full px-6 py-4 flex items-center justify-between border-b border-[--border] hover:bg-[--surface-secondary] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[--text-muted]" />
          <h2 className="font-display text-sm font-bold text-[--text]">
            {loading ? 'Loading...' : 'Full bill text'}
          </h2>
        </div>
        {text && (expanded ? <ChevronUp className="w-4 h-4 text-[--text-muted]" /> : <ChevronDown className="w-4 h-4 text-[--text-muted]" />)}
      </button>

      {fallbackUrl && !text && (
        <div className="px-6 py-4">
          <p className="text-sm text-[--text-secondary] mb-3">Full text is available on Congress.gov:</p>
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
            <ExternalLink className="w-3.5 h-3.5" /> Read on Congress.gov
          </a>
        </div>
      )}

      {text && expanded && (
        <div className="relative">
          <div className="sticky top-0 z-10 px-6 py-2 bg-[--surface-secondary] border-b border-[--border] flex items-center justify-between">
            <span className="text-xs text-[--text-muted]">{text.length.toLocaleString()} characters</span>
            <a href={`${congressGovUrl}/text`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[--accent] font-medium flex items-center gap-1 hover:text-[--accent-hover]">
              Congress.gov <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="px-6 py-6 max-h-[600px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-[--text-secondary]">{text}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

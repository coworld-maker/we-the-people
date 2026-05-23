'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  billId: string
  aiSummary: string | null
  officialSummary: string | null
  aiAnalyzedAt: string | null
}

export default function AISummary({ billId, aiSummary, officialSummary, aiAnalyzedAt }: Props) {
  const router = useRouter()
  const [summary, setSummary] = useState(aiSummary)
  const [analyzedAt, setAnalyzedAt] = useState(aiAnalyzedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOfficial, setShowOfficial] = useState(false)
  const triggeredRef = useRef(false)

  async function analyze() {
    if (triggeredRef.current) return // guard against duplicate fires
    triggeredRef.current = true
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Analysis failed')
      // Soft refresh — re-fetches server-component data (pros/cons/impacts/summary)
      // without a full page reload
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      triggeredRef.current = false // allow retry on error
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-trigger: fire analysis automatically when the section scrolls
  // ── into view and no analysis exists yet. IntersectionObserver means we
  // ── don't burn a Claude call on every page bounce — only users who
  // ── actually scroll to the AI section trigger generation.
  const sectionRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (summary || triggeredRef.current || !sectionRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          analyze()
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }, // start a little before the section is fully visible
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary])

  return (
    <div ref={sectionRef} className="card overflow-hidden">
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
        ) : loading ? (
          /* Auto-fire in progress */
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-[--accent] mx-auto mb-3 animate-spin" />
            <h3 className="font-display text-base font-bold text-[--text] mb-1">Analyzing this bill…</h3>
            <p className="text-sm text-[--text-muted] max-w-sm mx-auto">
              Pulling the official text, balancing pros and cons, and identifying who's affected.
              This usually takes 10–20 seconds.
            </p>
          </div>
        ) : error ? (
          /* Error after auto-fire — surface a manual retry */
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-display text-base font-bold text-[--text] mb-1">Couldn't analyze this bill</h3>
            <p className="text-sm text-[--text-muted] mb-4 max-w-sm mx-auto">{error}</p>
            <button onClick={analyze} className="btn-primary text-xs px-4 py-2">
              <Sparkles className="w-3.5 h-3.5" /> Try again
            </button>
            {officialSummary && (
              <div className="mt-6 p-4 bg-[--surface-secondary] rounded-lg border border-[--border] text-left">
                <p className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider mb-2">Official summary (fallback)</p>
                <p className="text-sm text-[--text-secondary] leading-relaxed">{officialSummary}</p>
              </div>
            )}
          </div>
        ) : (
          /* Initial render before observer fires — short placeholder, not a CTA */
          <div className="text-center py-8 text-[--text-muted] text-sm">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
            Preparing analysis…
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface Props {
  stateCode: string
  stateName: string
}

export default function StateAIDigest({ stateCode, stateName }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const triggered = useRef(false)

  useEffect(() => {
    if (triggered.current) return
    triggered.current = true

    let cancelled = false
    fetch(`/api/states/${stateCode}/digest`)
      .then(async r => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || 'Digest failed')
        if (cancelled) return
        setSummary(j.summary)
        setGeneratedAt(j.generatedAt)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [stateCode])

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[--border] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[--accent]" />
        <h2 className="font-display text-sm font-bold text-[--text] flex-1">
          What's happening in {stateName}
        </h2>
        {generatedAt && (
          <span className="text-[10px] text-[--text-muted]">
            Updated {new Date(generatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[--text-muted]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Synthesizing this state's legislative activity…
          </div>
        ) : error ? (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        ) : summary ? (
          <p className="text-sm text-[--text-secondary] leading-relaxed whitespace-pre-line">
            {summary}
          </p>
        ) : null}
      </div>
    </div>
  )
}

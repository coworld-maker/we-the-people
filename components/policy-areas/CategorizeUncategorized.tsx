'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, Check, AlertCircle, Play, Pause } from 'lucide-react'

interface BatchResult {
  processed: number
  categorized: number
  skipped: number
  failed: number
  remaining: number
}

const BATCH_SIZE = 10

export default function CategorizeUncategorized() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [initialRemaining, setInitialRemaining] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ categorized: 0, skipped: 0, failed: 0 })

  // Load current uncategorized count once
  useEffect(() => {
    let cancelled = false
    fetch('/api/bills/categorize-uncategorized')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d) return
        setRemaining(d.remaining)
        setInitialRemaining(d.remaining)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // The driver loop — runs while `running && !paused && remaining > 0`
  useEffect(() => {
    if (!running || paused) return
    if (remaining === null || remaining <= 0) {
      setRunning(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/bills/categorize-uncategorized?limit=${BATCH_SIZE}`, { method: 'POST' })
        const json: BatchResult | { error: string } = await res.json()
        if (cancelled) return
        if (!res.ok || 'error' in json) {
          setError(('error' in json && json.error) || 'Categorization failed')
          setRunning(false)
          return
        }
        const b = json as BatchResult
        setStats(s => ({
          categorized: s.categorized + b.categorized,
          skipped:     s.skipped     + b.skipped,
          failed:      s.failed      + b.failed,
        }))
        setRemaining(b.remaining)
        if (b.remaining === 0) setRunning(false)
        // Loop continues — `remaining` state change re-triggers the effect
      } catch (e: any) {
        if (cancelled) return
        setError(e.message || 'Network error')
        setRunning(false)
      }
    })()
    return () => { cancelled = true }
  }, [running, paused, remaining])

  if (remaining === null) {
    // Still loading the initial count — render nothing to avoid layout shift
    return null
  }
  if (remaining === 0 && !running && stats.categorized === 0 && stats.skipped === 0 && stats.failed === 0) {
    // Nothing to do, and nothing was done in this session either
    return null
  }

  const totalProcessed = stats.categorized + stats.skipped + stats.failed
  const denominator = initialRemaining || 1
  const progressPct = Math.min(100, Math.round((totalProcessed / denominator) * 100))
  const allDone = remaining === 0

  return (
    <div className="card p-5 mb-8 border-l-4 border-l-orange-400">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          allDone ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
        }`}>
          {allDone ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <h3 className="font-display text-sm font-bold text-[--text]">
              {allDone
                ? 'All bills are categorized'
                : `${remaining} uncategorized bill${remaining === 1 ? '' : 's'}`}
            </h3>

            {!allDone && (
              <div className="flex items-center gap-2">
                {running ? (
                  <button
                    onClick={() => setPaused(p => !p)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    {paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
                  </button>
                ) : (
                  <button
                    onClick={() => { setError(''); setRunning(true); setPaused(false) }}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    Categorize with AI
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-[--text-muted] mb-3">
            {allDone
              ? `Done — categorized ${stats.categorized}, skipped ${stats.skipped}${stats.failed ? `, ${stats.failed} failed` : ''}.`
              : running
              ? <>Processing… categorized <b className="text-emerald-600">{stats.categorized}</b>, skipped <b>{stats.skipped}</b>{stats.failed ? <>, failed <b className="text-red-600">{stats.failed}</b></> : null}.</>
              : <>Uses Claude to assign each bill to a standard CRS policy area based on its title, summary, and subjects.</>
            }
          </p>

          {/* Progress bar (visible while running or after activity) */}
          {(running || totalProcessed > 0) && (
            <div className="relative h-2 rounded-full bg-[--surface-tertiary] overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                  allDone ? 'bg-emerald-500' : 'bg-orange-400'
                }`}
                style={{ width: `${progressPct}%` }}
              />
              {running && !paused && (
                <Loader2 className="absolute top-1/2 -translate-y-1/2 w-3 h-3 text-[--text-muted] animate-spin" style={{ right: 4 }} />
              )}
            </div>
          )}

          {error && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

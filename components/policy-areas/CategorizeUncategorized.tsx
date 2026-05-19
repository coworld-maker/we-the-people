'use client'

import { useEffect, useState } from 'react'
import {
  Sparkles, Loader2, Check, AlertCircle, Play, Pause,
  RefreshCw, Building2, ChevronDown,
} from 'lucide-react'

type Mode = 'refresh' | 'ai'

interface RefreshResult {
  processed: number
  refreshed: number
  stillMissing: number
  failed: number
  remaining: number
}

interface AiResult {
  processed: number
  categorized: number
  skipped: number
  failed: number
  remaining: number
}

const REFRESH_BATCH = 15
const AI_BATCH = 10

export default function CategorizeUncategorized() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [initialRemaining, setInitialRemaining] = useState<number | null>(null)

  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [mode, setMode] = useState<Mode>('refresh')
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Aggregate stats across the whole session
  const [refreshStats, setRefreshStats] = useState({ refreshed: 0, stillMissing: 0, failed: 0 })
  const [aiStats, setAiStats] = useState({ categorized: 0, skipped: 0, failed: 0 })

  // Load initial uncategorized count
  useEffect(() => {
    let cancelled = false
    fetch('/api/bills/refresh-policy-areas')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d) return
        setRemaining(d.remaining)
        setInitialRemaining(d.remaining)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Driver loop — fires while running, calls the right endpoint each tick
  useEffect(() => {
    if (!running || paused) return
    if (remaining === null || remaining <= 0) {
      setRunning(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        if (mode === 'refresh') {
          const res = await fetch(`/api/bills/refresh-policy-areas?limit=${REFRESH_BATCH}`, { method: 'POST' })
          const json: RefreshResult | { error: string } = await res.json()
          if (cancelled) return
          if (!res.ok || 'error' in json) {
            setError(('error' in json && json.error) || 'Refresh failed')
            setRunning(false)
            return
          }
          const r = json as RefreshResult
          setRefreshStats(s => ({
            refreshed: s.refreshed + r.refreshed,
            stillMissing: s.stillMissing + r.stillMissing,
            failed: s.failed + r.failed,
          }))
          setRemaining(r.remaining)
          // Refresh pass is "done" when the rolling stillMissing batch matches processed
          // (Congress.gov has no more updates to give). The user can then switch to AI mode.
          if (r.processed > 0 && r.refreshed === 0 && r.stillMissing === r.processed) {
            setRunning(false) // soft-stop — wait for user to choose next step
          }
        } else {
          const res = await fetch(`/api/bills/categorize-uncategorized?limit=${AI_BATCH}`, { method: 'POST' })
          const json: AiResult | { error: string } = await res.json()
          if (cancelled) return
          if (!res.ok || 'error' in json) {
            setError(('error' in json && json.error) || 'AI categorization failed')
            setRunning(false)
            return
          }
          const a = json as AiResult
          setAiStats(s => ({
            categorized: s.categorized + a.categorized,
            skipped: s.skipped + a.skipped,
            failed: s.failed + a.failed,
          }))
          setRemaining(a.remaining)
          if (a.remaining === 0) setRunning(false)
        }
      } catch (e: any) {
        if (cancelled) return
        setError(e.message || 'Network error')
        setRunning(false)
      }
    })()
    return () => { cancelled = true }
  }, [running, paused, remaining, mode])

  if (remaining === null) return null

  const totalDone = (initialRemaining ?? 0) - remaining
  const progressPct = initialRemaining
    ? Math.min(100, Math.round((totalDone / initialRemaining) * 100))
    : 0
  const allDone = remaining === 0
  const refreshFinishedFruitless = !running && !allDone && refreshStats.refreshed > 0 && refreshStats.stillMissing > 0

  if (allDone && refreshStats.refreshed === 0 && aiStats.categorized === 0) return null

  return (
    <div className="card p-5 mb-8 border-l-4 border-l-orange-400">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          allDone ? 'bg-emerald-100 text-emerald-600'
                  : mode === 'refresh' ? 'bg-blue-100 text-blue-600'
                  : 'bg-orange-100 text-orange-600'
        }`}>
          {allDone ? <Check className="w-4 h-4" />
                   : mode === 'refresh' ? <Building2 className="w-4 h-4" />
                   : <Sparkles className="w-4 h-4" />}
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
                ) : mode === 'refresh' ? (
                  <button
                    onClick={() => { setError(''); setRunning(true); setPaused(false) }}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh from Congress.gov
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
            {allDone ? (
              <>Done — refreshed <b className="text-emerald-600">{refreshStats.refreshed}</b> from Congress.gov{aiStats.categorized > 0 && <> · AI categorized <b className="text-orange-600">{aiStats.categorized}</b></>}.</>
            ) : running ? (
              mode === 'refresh'
                ? <>Fetching fresh metadata from Congress.gov… refreshed <b className="text-emerald-600">{refreshStats.refreshed}</b>, still missing <b>{refreshStats.stillMissing}</b>{refreshStats.failed ? <>, failed <b className="text-red-600">{refreshStats.failed}</b></> : null}.</>
                : <>Asking Claude… categorized <b className="text-emerald-600">{aiStats.categorized}</b>, skipped <b>{aiStats.skipped}</b>{aiStats.failed ? <>, failed <b className="text-red-600">{aiStats.failed}</b></> : null}.</>
            ) : mode === 'refresh' ? (
              <>Re-fetches each bill's metadata from Congress.gov. Free, authoritative — picks up policy areas CRS has assigned since the last sync.</>
            ) : (
              <>Falls back to Claude for bills CRS hasn't classified yet. Constrained to the 32 official policy area labels.</>
            )}
          </p>

          {/* Progress bar */}
          {(running || totalDone > 0) && (
            <div className="relative h-2 rounded-full bg-[--surface-tertiary] overflow-hidden mb-2">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                  allDone ? 'bg-emerald-500'
                          : mode === 'refresh' ? 'bg-blue-400'
                          : 'bg-orange-400'
                }`}
                style={{ width: `${progressPct}%` }}
              />
              {running && !paused && (
                <Loader2 className="absolute top-1/2 -translate-y-1/2 w-3 h-3 text-[--text-muted] animate-spin" style={{ right: 4 }} />
              )}
            </div>
          )}

          {/* Mode switcher — visible after refresh has run out of fresh data, OR via advanced toggle */}
          {!allDone && !running && (refreshFinishedFruitless || showAdvanced) && (
            <div className="mt-3 p-3 bg-[--surface-secondary] rounded-lg">
              <p className="text-[11px] text-[--text-muted] mb-2">
                {refreshFinishedFruitless
                  ? `Congress.gov refreshed ${refreshStats.refreshed} bills. ${remaining} still have no CRS policy area — fall back to AI?`
                  : 'Choose method:'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('refresh')}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                    mode === 'refresh'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-[--surface] text-[--text-secondary] border border-[--border] hover:bg-[--surface-tertiary]'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  Congress.gov (free)
                </button>
                <button
                  onClick={() => setMode('ai')}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                    mode === 'ai'
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-[--surface] text-[--text-secondary] border border-[--border] hover:bg-[--surface-tertiary]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  AI (Claude)
                </button>
              </div>
            </div>
          )}

          {/* Advanced disclosure — show even before refresh runs out */}
          {!allDone && !running && !refreshFinishedFruitless && !showAdvanced && (
            <button
              onClick={() => setShowAdvanced(true)}
              className="text-[11px] text-[--text-muted] hover:text-[--accent] transition-colors flex items-center gap-0.5 mt-1"
            >
              <ChevronDown className="w-3 h-3" /> Show methods
            </button>
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

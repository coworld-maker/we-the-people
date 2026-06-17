'use client'

/**
 * Moderation queue — moderator-only (the API enforces it; non-mods get a 403
 * and an empty state). Lists open reports with the reported comment, and lets
 * a moderator remove the comment or dismiss the report.
 */

import { useEffect, useState } from 'react'
import { ShieldAlert, Trash2, X, Flag } from 'lucide-react'

interface Report {
  id: string
  discussionId: string
  reason: string
  detail: string | null
  createdAt: string
  comment: { id: string; content: string; billId: string; user: { username: string | null; firstName: string | null } } | null
}

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/reports')
      if (res.status === 403) { setDenied(true); return }
      if (res.ok) setReports((await res.json()).reports || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function removeComment(r: Report) {
    if (!r.comment) return
    setBusy(r.id)
    try {
      await fetch(`/api/bills/${r.comment.billId}/discussions?commentId=${r.comment.id}`, { method: 'DELETE' })
      setReports(rs => rs.filter(x => x.id !== r.id))
    } catch {} finally { setBusy(null) }
  }

  async function dismiss(r: Report) {
    setBusy(r.id)
    try {
      await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, status: 'dismissed' }),
      })
      setReports(rs => rs.filter(x => x.id !== r.id))
    } catch {} finally { setBusy(null) }
  }

  if (denied) {
    return (
      <div className="max-w-2xl mx-auto card p-8 text-center">
        <ShieldAlert className="w-8 h-8 text-[--text-muted] mx-auto mb-2 opacity-50" />
        <p className="text-sm font-semibold text-[--text]">Moderators only</p>
        <p className="text-xs text-[--text-muted] mt-1">This page is restricted to platform moderators.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="w-5 h-5 text-[--accent]" />
        <h1 className="font-display text-xl font-extrabold text-[--text]">Moderation queue</h1>
        <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px] ml-1">
          {reports.length} open
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-[--text-muted] py-8 text-center">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-[--text]">Nothing to review</p>
          <p className="text-xs text-[--text-muted] mt-1">No open reports. The community is behaving.</p>
        </div>
      ) : (
        reports.map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-red-50 text-red-700 border border-red-200 text-[10px] capitalize">{r.reason}</span>
              <span className="text-xs text-[--text-muted]">
                by @{r.comment?.user.username || r.comment?.user.firstName || 'unknown'} · {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-[--text-secondary] bg-[--surface-secondary] rounded-lg p-3 mb-3 whitespace-pre-wrap">
              {r.comment?.content ?? '[comment no longer exists]'}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => removeComment(r)} disabled={busy === r.id || !r.comment}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5" /> Remove comment
              </button>
              <button onClick={() => dismiss(r)} disabled={busy === r.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[--border] text-xs font-semibold text-[--text-secondary] hover:text-[--text] disabled:opacity-40">
                <X className="w-3.5 h-3.5" /> Dismiss
              </button>
              {r.comment && (
                <a href={`/bills/${r.comment.billId}#discussion`} target="_blank" rel="noreferrer"
                  className="ml-auto text-xs font-semibold text-[--accent] hover:underline">
                  View in context →
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

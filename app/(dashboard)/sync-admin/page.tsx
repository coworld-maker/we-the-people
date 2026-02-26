'use client'

import { useState } from 'react'

export default function SyncAdminPage() {
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeOp, setActiveOp] = useState('')

  async function call(url: string, body: object, label: string) {
    setLoading(true)
    setActiveOp(label)
    setResult(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-secret': secret,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
      setActiveOp('')
    }
  }

  const btn = (label: string, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      disabled={loading || !secret}
      className="px-4 py-2 text-sm rounded-lg border border-[--border] text-[--text-secondary] hover:text-[--text] hover:bg-[--surface-secondary] disabled:opacity-40 transition-colors"
    >
      {loading && activeOp === label ? 'Running...' : label}
    </button>
  )

  return (
    <div className="max-w-2xl mx-auto py-12 px-5 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[--text]">Sync Admin</h1>
        <p className="text-sm text-[--text-muted] mt-1">Manage data sync from Congress.gov</p>
      </div>

      {/* Secret */}
      <div className="card p-5">
        <label className="block text-sm font-medium text-[--text-secondary] mb-2">
          CRON_SECRET (from Vercel env vars)
        </label>
        <input
          type="password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          placeholder="Paste your CRON_SECRET here"
          className="w-full px-3 py-2 rounded-lg border border-[--border] bg-[--surface-secondary] text-[--text] text-sm"
        />
      </div>

      {/* Bill Sync */}
      <div className="card p-5 space-y-3">
        <h2 className="font-medium text-[--text]">📋 Bill Sync (119th Congress)</h2>
        <p className="text-xs text-[--text-muted]">Fetches bills from Congress.gov and saves to your DB. Start here.</p>
        <div className="flex flex-wrap gap-2">
          {btn('Sync 50 Recent Bills', () =>
            call('/api/sync-bills', { congress: 119, limit: 50 }, 'Sync 50 Recent Bills')
          )}
          {btn('Sync 250 Bills', () =>
            call('/api/sync-bills', { congress: 119, limit: 250 }, 'Sync 250 Bills')
          )}
          {btn('Sync Health Bills', () =>
            call('/api/sync-bills', { congress: 119, limit: 50, policyArea: 'Health' }, 'Sync Health Bills')
          )}
          {btn('Sync Tax/Finance Bills', () =>
            call('/api/sync-bills', { congress: 119, limit: 50, policyArea: 'Economics and Public Finance' }, 'Sync Tax/Finance Bills')
          )}
        </div>
      </div>

      {/* Congress Vote Sync */}
      <div className="card p-5 space-y-3">
        <h2 className="font-medium text-[--text]">🗳️ Congress Vote Sync (119th Congress)</h2>
        <p className="text-xs text-[--text-muted]">Syncs how members of Congress voted on bills. Run after syncing bills.</p>
        <div className="flex flex-wrap gap-2">
          {btn('Sync Member Votes (119th)', () =>
            call('/api/sync-congress-votes', { congress: '119' }, 'Sync Member Votes (119th)')
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-5">
          <h2 className="text-sm font-medium text-[--text-secondary] mb-3">Result</h2>
          <pre className="text-xs text-[--text] overflow-auto whitespace-pre-wrap bg-[--surface-secondary] p-3 rounded-lg">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

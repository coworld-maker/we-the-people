'use client'

import { useState } from 'react'

export default function SyncAdminPage() {
  const [secret, setSecret] = useState('')
  const [billId, setBillId] = useState('cmlq6d9z6000104l5517420nv')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function runSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/sync-congress-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-secret': secret,
        },
        body: JSON.stringify({ billId }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function runCongress119() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/sync-congress-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-secret': secret,
        },
        body: JSON.stringify({ congress: '119' }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-5">
      <h1 className="font-display text-2xl font-bold text-[--text] mb-8">
        Congress Vote Sync — Admin
      </h1>

      <div className="card p-6 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-[--text-secondary] mb-1">
            Sync Secret (CRON_SECRET from Vercel)
          </label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Enter your CRON_SECRET"
            className="w-full px-3 py-2 rounded-lg border border-[--border] bg-[--surface-secondary] text-[--text] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[--text-secondary] mb-1">
            Bill ID (DB cuid)
          </label>
          <input
            type="text"
            value={billId}
            onChange={e => setBillId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[--border] bg-[--surface-secondary] text-[--text] text-sm font-mono"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={runSync}
            disabled={loading || !secret}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Sync This Bill'}
          </button>
          <button
            onClick={runCongress119}
            disabled={loading || !secret}
            className="px-4 py-2 text-sm rounded-lg border border-[--border] text-[--text-secondary] hover:text-[--text] disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Sync All 119th Congress'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card p-6">
          <h2 className="text-sm font-medium text-[--text-secondary] mb-3">Result</h2>
          <pre className="text-xs text-[--text] overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

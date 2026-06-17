'use client'

/**
 * Inline username picker. Lets a user claim a public pseudonym before posting,
 * so political opinions aren't tied to their real name. Calls onSet with the
 * chosen username so the parent can update its state.
 */

import { useState } from 'react'
import { AtSign, Check, AlertCircle } from 'lucide-react'

export default function UsernamePicker({ onSet }: { onSet: (username: string) => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const v = value.trim()
    if (!v) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/user/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: v }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not set username'); return }
      onSet(data.username)
    } catch { setError('Network error') } finally { setBusy(false) }
  }

  return (
    <div className="mb-6 p-4 rounded-xl bg-[--accent-light] border border-[--accent]/15">
      <div className="flex items-center gap-2 mb-1">
        <AtSign className="w-4 h-4 text-[--accent]" />
        <p className="text-sm font-bold text-[--text]">Choose a username to post</p>
      </div>
      <p className="text-xs text-[--text-muted] mb-3">
        Your username is public on discussions — your real name stays private. 3–20 letters, numbers, or underscores.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-1 px-3 rounded-lg border border-[--border] bg-[--surface] focus-within:ring-2 focus-within:ring-[--accent]">
          <span className="text-sm text-[--text-muted]">@</span>
          <input
            value={value}
            onChange={e => { setValue(e.target.value.replace(/[^a-zA-Z0-9_]/g, '')); setError('') }}
            onKeyDown={e => e.key === 'Enter' && save()}
            maxLength={20}
            placeholder="yourname"
            className="flex-1 py-2 text-sm bg-transparent outline-none text-[--text] placeholder-[--text-muted]"
          />
        </div>
        <button onClick={save} disabled={busy || value.trim().length < 3}
          className="btn-primary text-sm disabled:opacity-40 flex items-center gap-1.5">
          {busy ? 'Saving…' : <><Check className="w-3.5 h-3.5" /> Claim</>}
        </button>
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </div>
      )}
    </div>
  )
}

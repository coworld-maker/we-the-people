'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

interface Props {
  billId: string
}

export default function FollowButton({ billId }: Props) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [flash, setFlash] = useState<'followed' | 'unfollowed' | null>(null)

  useEffect(() => {
    fetch(`/api/bills/follow?billId=${billId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFollowing(d.following) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [billId])

  async function toggle() {
    if (toggling) return
    setToggling(true)
    try {
      const res = await fetch('/api/bills/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId }),
      })
      if (res.ok) {
        const d = await res.json()
        setFollowing(d.following)
        setFlash(d.following ? 'followed' : 'unfollowed')
        setTimeout(() => setFlash(null), 2500)
      }
    } catch {}
    setToggling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[--border] text-xs text-[--text-muted]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Follow</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={toggling}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          following
            ? 'bg-[--accent]/10 border-[--accent]/30 text-[--accent] hover:bg-red-50 hover:border-red-300 hover:text-red-600'
            : 'border-[--border] text-[--text-secondary] hover:border-[--accent]/40 hover:text-[--accent]'
        }`}
      >
        {following
          ? <BellOff className="w-3.5 h-3.5" />
          : <Bell className="w-3.5 h-3.5" />
        }
        {following ? 'Following' : 'Follow'}
      </button>

      {flash && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-md z-10 pointer-events-none
          bg-[--surface] border border-[--border] text-[--text]">
          {flash === 'followed' ? '🔔 You\'ll be notified of updates' : '🔕 Unfollowed'}
        </div>
      )}
    </div>
  )
}

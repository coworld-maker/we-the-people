'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  bill?: { id: string; shortTitle: string | null; title: string } | null
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Load on mount
  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setNotifications(d.notifications)
        setUnread(d.unreadCount)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
    setUnread(0)
    setNotifications(n => n.map(x => ({ ...x, read: true })))
    await fetch('/api/notifications', { method: 'PATCH' })
  }

  function handleOpen() {
    setOpen(o => !o)
    if (!open && unread > 0) markAllRead()
  }

  if (!loaded) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-[--text-muted] hover:text-[--accent] hover:bg-[--surface-secondary] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[--surface] rounded-2xl shadow-2xl border border-[--border] z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[--border] flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[--text]">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-[--text-muted] hover:text-[--text] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-[--text-muted] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[--text-muted]">No notifications yet</p>
                <p className="text-xs text-[--text-muted] mt-1">Follow bills to get updates when they move</p>
              </div>
            ) : (
              <div className="divide-y divide-[--border]">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-[--accent]/5' : ''}`}>
                    {n.bill ? (
                      <Link
                        href={`/bills/${n.bill.id}`}
                        onClick={() => setOpen(false)}
                        className="block hover:bg-[--surface-secondary] -mx-4 px-4 py-1 transition-colors"
                      >
                        <p className="text-xs font-semibold text-[--text] leading-snug">{n.title}</p>
                        <p className="text-xs text-[--text-muted] mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-[--text-muted] mt-1">{timeAgo(n.createdAt)}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-[--text] leading-snug">{n.title}</p>
                        <p className="text-xs text-[--text-muted] mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-[--text-muted] mt-1">{timeAgo(n.createdAt)}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[--border] flex items-center justify-between">
              <p className="text-[10px] text-[--text-muted]">Follow bills to get status updates</p>
              <Link
                href="/bills"
                onClick={() => setOpen(false)}
                className="text-[10px] font-semibold text-[--accent] hover:underline"
              >
                Browse bills →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

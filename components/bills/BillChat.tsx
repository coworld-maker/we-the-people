'use client'

/**
 * Live (polled) per-bill chat. Polls every 4s for new messages since the last
 * one seen. Gated behind a username (reuses UsernamePicker); banned users are
 * blocked server-side; moderators get a delete control. Real-time websockets
 * are a future upgrade — polling keeps it dependency-free on Vercel.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessagesSquare, Send, Trash2, AlertCircle } from 'lucide-react'
import UsernamePicker from '@/components/ui/UsernamePicker'

interface Msg { id: string; username: string; content: string; createdAt: string; userId: string }

const COLORS = ['text-indigo-600','text-emerald-600','text-amber-600','text-rose-600','text-violet-600','text-cyan-600']
function nameColor(u: string) { return COLORS[u.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%COLORS.length] }
function clock(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function BillChat({ billId }: { billId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [isMod, setIsMod] = useState(false)
  const [username, setUsername] = useState<string | null | undefined>(undefined)
  const lastTs = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottom = useRef(true)

  const poll = useCallback(async () => {
    try {
      const qs = lastTs.current ? `?since=${encodeURIComponent(lastTs.current)}` : ''
      const res = await fetch(`/api/bills/${billId}/chat${qs}`)
      if (!res.ok) return
      const d = await res.json()
      setIsMod(d.isModerator || false)
      if (d.messages?.length) {
        setMessages(prev => {
          const seen = new Set(prev.map((m: Msg) => m.id))
          const fresh = d.messages.filter((m: Msg) => !seen.has(m.id))
          if (!fresh.length) return prev
          lastTs.current = d.messages[d.messages.length - 1].createdAt
          return [...prev, ...fresh]
        })
      }
    } catch {}
  }, [billId])

  useEffect(() => {
    fetch('/api/user/username').then(r => r.ok ? r.json() : null)
      .then(d => setUsername(d ? d.username : null)).catch(() => setUsername(null))
  }, [])

  useEffect(() => {
    poll()
    const t = setInterval(poll, 4000)
    return () => clearInterval(t)
  }, [poll])

  // Auto-scroll to newest only if the user was already at the bottom
  useEffect(() => {
    if (atBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true); setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const d = await res.json()
      if (!res.ok) {
        if (d.needsUsername) setUsername(null)
        setError(d.error || 'Failed to send'); return
      }
      setText('')
      atBottom.current = true
      // optimistic append; poll will reconcile
      setMessages(prev => prev.some(m => m.id === d.message.id) ? prev : [...prev, d.message])
      lastTs.current = d.message.createdAt
    } catch { setError('Network error') } finally { setSending(false) }
  }

  async function del(id: string) {
    try {
      await fetch(`/api/bills/${billId}/chat?messageId=${id}`, { method: 'DELETE' })
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch {}
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-[--border] flex items-center gap-2">
        <MessagesSquare className="w-4 h-4 text-[--accent]" />
        <h3 className="font-display text-sm font-bold text-[--text]">Live chat</h3>
        <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">Beta</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-[--text-muted]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live
        </span>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="h-72 overflow-y-auto px-5 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-[--text-muted] text-center py-8">
            No messages yet. Say something — the room is live.
          </p>
        ) : messages.map(m => (
          <div key={m.id} className="group/msg flex items-baseline gap-2 text-sm">
            <span className={`font-semibold shrink-0 ${nameColor(m.username)}`}>@{m.username}</span>
            <span className="text-[--text-secondary] break-words min-w-0">{m.content}</span>
            <span className="text-[10px] text-[--text-muted] ml-auto shrink-0">{clock(m.createdAt)}</span>
            {isMod && (
              <button onClick={() => del(m.id)}
                className="opacity-0 group-hover/msg:opacity-100 transition-opacity text-[--text-muted] hover:text-red-500 shrink-0"
                title="Delete (moderator)">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[--border] p-3">
        {username === null ? (
          <UsernamePicker onSet={setUsername} />
        ) : (
          <>
            <div className="flex gap-2">
              <input value={text} onChange={e => { setText(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={username === undefined ? 'Loading…' : 'Message the room…'}
                maxLength={500} disabled={username === undefined}
                className="flex-1 px-3 py-2 text-sm border border-[--border] rounded-lg outline-none focus:ring-2 focus:ring-[--accent] text-[--text] placeholder-[--text-muted] disabled:opacity-50" />
              <button onClick={send} disabled={sending || !text.trim()}
                className="btn-primary px-3 disabled:opacity-40"><Send className="w-3.5 h-3.5" /></button>
            </div>
            {error && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3 shrink-0" /> {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

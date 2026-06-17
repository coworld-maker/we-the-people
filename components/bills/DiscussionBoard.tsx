'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, CornerDownRight, AlertCircle, Trash2, ShieldAlert, Flag, Check } from 'lucide-react'
import UsernamePicker from '@/components/ui/UsernamePicker'

interface User { id: string; firstName: string | null; lastName: string | null; username?: string | null }
interface Item { id: string; content: string; createdAt: string; user: User; replies?: Item[] }

function name(u: User) {
  if (u.username) return `@${u.username}`
  return u.firstName ? `${u.firstName} ${(u.lastName || '').charAt(0)}.`.trim() : 'Citizen'
}
function initial(u: User) {
  return (u.username || u.firstName || 'C').charAt(0).toUpperCase()
}

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'spam', label: 'Spam' },
  { value: 'misinfo', label: 'Misinformation' },
  { value: 'offensive', label: 'Offensive content' },
  { value: 'other', label: 'Something else' },
]

function ReportControl({ discussionId }: { discussionId: string }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function report(reason: string) {
    setBusy(true)
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discussionId, reason }),
      })
      setDone(true); setOpen(false)
    } catch {} finally { setBusy(false) }
  }

  if (done) {
    return (
      <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
        <Check className="w-3 h-3" /> Reported
      </span>
    )
  }

  return (
    <div className="ml-auto relative">
      <button onClick={() => setOpen(o => !o)}
        className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-[--text-muted] hover:text-amber-600"
        title="Report comment"
      >
        <Flag className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-20 w-44 bg-[--surface] border border-[--border] rounded-lg shadow-lg py-1">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[--text-muted]">Report for</p>
          {REPORT_REASONS.map(r => (
            <button key={r.value} disabled={busy} onClick={() => report(r.value)}
              className="w-full text-left px-3 py-1.5 text-xs text-[--text-secondary] hover:bg-[--surface-secondary] hover:text-[--text] disabled:opacity-50"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'now'; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`
}

const COLORS = ['bg-indigo-600','bg-emerald-600','bg-amber-600','bg-rose-600','bg-violet-600','bg-cyan-600']
function avatarBg(id: string) { return COLORS[id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%COLORS.length] }

function Comment({ c, billId, onRefresh, depth=0, isAdmin }: { c: Item; billId: string; onRefresh: ()=>void; depth?: number; isAdmin: boolean }) {
  const [showReply, setShowReply] = useState(false)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showReplies, setShowReplies] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleReply() {
    if (!reply.trim()) return; setSubmitting(true); setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content:reply,parentId:c.id}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error||'Failed'); return }
      setReply(''); setShowReply(false); onRefresh()
    } catch { setError('Network error') } finally { setSubmitting(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/bills/${billId}/discussions?commentId=${c.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Delete failed'); return }
      onRefresh()
    } catch { setError('Network error') }
    finally { setDeleting(false); setConfirmDelete(false) }
  }

  return (
    <div className={depth > 0 ? 'ml-8 pl-4 border-l-2 border-[--surface-tertiary]' : ''}>
      <div className="py-4 group/comment">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-7 h-7 rounded-full ${avatarBg(c.user.id)} flex items-center justify-center text-white text-xs font-semibold`}>
            {initial(c.user)}
          </div>
          <span className="text-sm font-semibold text-[--text]">{name(c.user)}</span>
          <span className="text-xs text-[--text-muted]">{timeAgo(c.createdAt)}</span>

          {/* Moderator delete takes priority; otherwise anyone can report */}
          {isAdmin ? (
            !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)}
                className="ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity text-[--text-muted] hover:text-red-500"
                title="Delete comment (moderator)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <ReportControl discussionId={c.id} />
          )}
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-700 font-medium">Delete this comment and all replies?</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-[--text-muted] hover:text-[--text] font-medium">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        <p className="text-[15px] text-[--text-secondary] leading-relaxed whitespace-pre-wrap mb-2">{c.content}</p>
        <div className="flex items-center gap-3">
          {depth < 2 && (
            <button onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-[--text-muted] hover:text-[--accent] font-medium transition-colors"
            >
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          )}
          {c.replies && c.replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-[--text-muted] hover:text-[--accent] font-medium transition-colors"
            >
              {c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
        {showReply && (
          <div className="mt-3 flex gap-2">
            <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key==='Enter' && handleReply()}
              placeholder="Write a reply..." maxLength={2000}
              className="flex-1 px-3 py-2 text-sm border border-[--border] rounded-lg focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none text-[--text] placeholder-[--text-muted]" />
            <button onClick={handleReply} disabled={submitting||!reply.trim()}
              className="btn-primary px-3 py-2 disabled:opacity-40">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {error && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
          </div>
        )}
      </div>
      {c.replies && showReplies && c.replies.map(r => <Comment key={r.id} c={r} billId={billId} onRefresh={onRefresh} depth={depth+1} isAdmin={isAdmin} />)}
    </div>
  )
}

export default function DiscussionBoard({ billId }: { billId: string }) {
  const [discussions, setDiscussions] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  // undefined = still loading, null = no username yet, string = set
  const [username, setUsername] = useState<string | null | undefined>(undefined)

  async function load() {
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`)
      if (res.ok) {
        const d = await res.json()
        setDiscussions(d.discussions)
        setIsAdmin(d.isAdmin || false)
      }
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [billId])

  useEffect(() => {
    fetch('/api/user/username')
      .then(r => r.ok ? r.json() : null)
      .then(d => setUsername(d ? d.username : null))
      .catch(() => setUsername(null))
  }, [])

  async function handlePost() {
    if (!text.trim()) return; setSubmitting(true); setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content:text}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error||'Failed'); return }
      setText(''); load()
    } catch { setError('Network error') } finally { setSubmitting(false) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-[--border] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[--text-muted]" />
          <h2 className="font-display text-sm font-bold text-[--text]">Discussion</h2>
          {isAdmin && (
            <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
              <ShieldAlert className="w-3 h-3" /> Admin
            </span>
          )}
        </div>
        <span className="text-xs text-[--text-muted]">{discussions.length} comment{discussions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="p-6">
        {/* Username gate — pseudonym required before posting */}
        {username === null && <UsernamePicker onSet={setUsername} />}

        {/* Compose */}
        <div className={`mb-6 ${username == null ? 'opacity-50 pointer-events-none' : ''}`}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Share your perspective. Be respectful and constructive."
            maxLength={2000} rows={3}
            className="w-full px-4 py-3 border border-[--border] rounded-lg text-[15px] resize-none text-[--text] placeholder-[--text-muted] focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none"
          />
          {error && (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[--text-muted]">{text.length}/2,000</span>
            <button onClick={handlePost} disabled={submitting||!text.trim()} className="btn-primary text-sm disabled:opacity-40">
              {submitting ? 'Posting...' : 'Post comment'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6"><p className="text-sm text-[--text-muted]">Loading...</p></div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-[--text-muted] mx-auto mb-2 opacity-40" />
            <p className="text-sm text-[--text-muted]">No comments yet. Start the conversation.</p>
          </div>
        ) : (
          <div className="divide-y divide-[--border]">
            {discussions.map(d => <Comment key={d.id} c={d} billId={billId} onRefresh={load} isAdmin={isAdmin} />)}
          </div>
        )}
      </div>
    </div>
  )
}

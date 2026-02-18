'use client'

import { useState, useEffect } from 'react'

interface DiscussionUser { id: string; firstName: string | null; lastName: string | null }
interface DiscussionItem { id: string; content: string; createdAt: string; user: DiscussionUser; replies?: DiscussionItem[] }

function name(u: DiscussionUser) { return u.firstName ? `${u.firstName} ${(u.lastName || '').charAt(0)}.`.trim() : 'Citizen' }
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m`; if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`
}
const COLORS = ['from-indigo-400 to-blue-500','from-emerald-400 to-teal-500','from-amber-400 to-orange-500','from-rose-400 to-pink-500','from-violet-400 to-purple-500','from-cyan-400 to-sky-500']
function avatarColor(id: string) { return COLORS[id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%COLORS.length] }

function Comment({ c, billId, onRefresh, depth=0 }: { c: DiscussionItem; billId: string; onRefresh: ()=>void; depth?: number }) {
  const [showReply, setShowReply] = useState(false)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showReplies, setShowReplies] = useState(true)

  async function handleReply() {
    if (!reply.trim()) return; setSubmitting(true); setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content:reply,parentId:c.id}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error||'Failed'); return }
      setReply(''); setShowReply(false); onRefresh()
    } catch { setError('Network error') } finally { setSubmitting(false) }
  }

  return (
    <div className={depth > 0 ? 'ml-6 pl-4 border-l-2 border-indigo-100' : ''}>
      <div className="py-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(c.user.id)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
            {(c.user.firstName||'C').charAt(0).toUpperCase()}
          </div>
          <span className="font-display font-bold text-[#0F172A] text-sm">{name(c.user)}</span>
          <span className="text-xs text-gray-400 font-body">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="text-gray-700 text-[15px] leading-relaxed mb-2 whitespace-pre-wrap font-body">{c.content}</p>
        <div className="flex items-center gap-3">
          {depth < 2 && <button onClick={() => setShowReply(!showReply)} className="text-xs text-[#6366F1] hover:text-[#4F46E5] font-bold font-body">↩ Reply</button>}
          {c.replies && c.replies.length > 0 && (
            <button onClick={() => setShowReplies(!showReplies)} className="text-xs text-gray-400 hover:text-[#6366F1] font-medium font-body">
              {showReplies ? '▲' : '▼'} {c.replies.length} {c.replies.length===1?'reply':'replies'}
            </button>
          )}
        </div>
        {showReply && (
          <div className="mt-3 flex gap-2">
            <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleReply()}
              placeholder="Write a reply..." maxLength={2000}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6366F1] text-[#0F172A] placeholder-gray-400 font-body" />
            <button onClick={handleReply} disabled={submitting||!reply.trim()}
              className="px-4 py-2 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] disabled:opacity-40 text-sm font-bold font-display">
              {submitting ? '...' : '→'}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg font-body">⚠️ {error}</p>}
      </div>
      {c.replies && showReplies && c.replies.map(r => <Comment key={r.id} c={r} billId={billId} onRefresh={onRefresh} depth={depth+1} />)}
    </div>
  )
}

export default function DiscussionBoard({ billId }: { billId: string }) {
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try { const res = await fetch(`/api/bills/${billId}/discussions`); if(res.ok){const d=await res.json();setDiscussions(d.discussions)} } catch{} finally{setLoading(false)}
  }
  useEffect(() => { load() }, [billId])

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
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-violet-100">
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">💬 Citizen Discussion</h2>
          <span className="text-sm text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full font-body">{discussions.length}</span>
        </div>
      </div>
      <div className="p-6">
        {/* New comment */}
        <div className="mb-6">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share your perspective... Be respectful and constructive."
            maxLength={2000} rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none text-[15px] text-[#0F172A] placeholder-gray-400 bg-gray-50/50 font-body" />
          {error && <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100 font-body">⚠️ {error}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400 font-body">{text.length}/2000</span>
            <button onClick={handlePost} disabled={submitting||!text.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-200 font-display font-bold text-sm disabled:opacity-40 transition-all hover:-translate-y-0.5">
              {submitting ? '⏳ Posting...' : '💬 Post Comment'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8"><p className="text-sm text-gray-400 font-body">Loading...</p></div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-400 font-body">No comments yet. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {discussions.map(d => <Comment key={d.id} c={d} billId={billId} onRefresh={load} />)}
          </div>
        )}
      </div>
    </div>
  )
}

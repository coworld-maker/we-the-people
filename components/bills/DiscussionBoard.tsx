'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Reply, Loader2, ChevronDown, ChevronUp, AlertCircle, Flag } from 'lucide-react'

interface DiscussionUser { id: string; firstName: string | null; lastName: string | null }
interface DiscussionItem {
  id: string; content: string; createdAt: string; user: DiscussionUser; replies?: DiscussionItem[]
}

function getDisplayName(user: DiscussionUser): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName.charAt(0)}.`
  if (user.firstName) return user.firstName
  return 'Citizen'
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const AVATAR_COLORS = [
  'from-indigo-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-sky-500',
]

function getAvatarColor(userId: string) {
  const idx = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function Comment({ comment, billId, onReplyPosted, depth = 0 }: {
  comment: DiscussionItem; billId: string; onReplyPosted: () => void; depth?: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showReplies, setShowReplies] = useState(true)

  async function handleReply() {
    if (!replyText.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText, parentId: comment.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post'); return }
      setReplyText('')
      setShowReply(false)
      onReplyPosted()
    } catch { setError('Network error') }
    finally { setSubmitting(false) }
  }

  const hasReplies = comment.replies && comment.replies.length > 0
  const avatarColor = getAvatarColor(comment.user.id)

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-indigo-100' : ''}`}>
      <div className="py-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
            {(comment.user.firstName || 'C').charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-900 text-sm">{getDisplayName(comment.user)}</span>
          <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
        </div>

        <p className="text-gray-700 text-[15px] leading-relaxed mb-2 whitespace-pre-wrap">{comment.content}</p>

        <div className="flex items-center gap-3">
          {depth < 2 && (
            <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
          )}
          {hasReplies && (
            <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors">
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>

        {showReply && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                placeholder="Write a reply..." maxLength={2000}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleReply} disabled={submitting || !replyText.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
              </div>
            )}
          </div>
        )}
      </div>

      {hasReplies && showReplies && comment.replies!.map(reply => (
        <Comment key={reply.id} comment={reply} billId={billId} onReplyPosted={onReplyPosted} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function DiscussionBoard({ billId }: { billId: string }) {
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchDiscussions() {
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`)
      if (res.ok) { const data = await res.json(); setDiscussions(data.discussions) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchDiscussions() }, [billId])

  async function handlePost() {
    if (!newComment.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post'); return }
      setNewComment('')
      fetchDiscussions()
    } catch { setError('Network error') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-violet-100">
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Citizen Discussion</h2>
          </div>
          <span className="text-sm text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full">
            {discussions.length} comment{discussions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* New comment */}
        <div className="mb-6">
          <textarea
            value={newComment} onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your perspective on this bill... Be respectful and constructive."
            maxLength={2000} rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none text-[15px] text-gray-900 placeholder-gray-400 bg-gray-50"
          />
          {error && (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{newComment.length}/2000</span>
            <button
              onClick={handlePost} disabled={submitting || !newComment.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 font-semibold text-sm disabled:opacity-40 transition-all shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post Comment
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading discussion...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-7 h-7 text-violet-300" />
            </div>
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {discussions.map(d => (
              <Comment key={d.id} comment={d} billId={billId} onReplyPosted={fetchDiscussions} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

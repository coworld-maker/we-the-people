'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Reply, Loader2, ChevronDown, ChevronUp, User } from 'lucide-react'

interface DiscussionUser {
  id: string
  firstName: string | null
  lastName: string | null
}

interface DiscussionItem {
  id: string
  content: string
  createdAt: string
  user: DiscussionUser
  replies?: DiscussionItem[]
}

interface DiscussionBoardProps {
  billId: string
}

function getDisplayName(user: DiscussionUser): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName.charAt(0)}.`
  if (user.firstName) return user.firstName
  return 'Anonymous Citizen'
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function Comment({
  comment,
  billId,
  onReplyPosted,
  depth = 0,
}: {
  comment: DiscussionItem
  billId: string
  onReplyPosted: () => void
  depth?: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  async function handleReply() {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText, parentId: comment.id }),
      })
      if (res.ok) {
        setReplyText('')
        setShowReply(false)
        onReplyPosted()
      }
    } catch (err) {
      console.error('Reply failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-blue-100' : ''}`}>
      <div className="py-4">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {(comment.user.firstName || 'A').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900 text-sm">
            {getDisplayName(comment.user)}
          </span>
          <span className="text-xs text-gray-400">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        <p className="text-gray-700 text-[15px] leading-relaxed mb-2 whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {depth < 2 && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReply && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
              placeholder="Write a reply..."
              maxLength={2000}
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Replies */}
      {hasReplies && showReplies && (
        <div>
          {comment.replies!.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              billId={billId}
              onReplyPosted={onReplyPosted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DiscussionBoard({ billId }: DiscussionBoardProps) {
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function fetchDiscussions() {
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`)
      if (res.ok) {
        const data = await res.json()
        setDiscussions(data.discussions)
      }
    } catch (err) {
      console.error('Failed to fetch discussions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscussions()
  }, [billId])

  async function handlePost() {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bills/${billId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })
      if (res.ok) {
        setNewComment('')
        fetchDiscussions()
      }
    } catch (err) {
      console.error('Post failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Citizen Discussion</h2>
          </div>
          <span className="text-sm text-purple-100">
            {discussions.length} {discussions.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* New comment input */}
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your perspective on this bill... Be respectful and constructive."
            maxLength={2000}
            rows={3}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-[15px]"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {newComment.length}/2000 characters
            </span>
            <button
              onClick={handlePost}
              disabled={submitting || !newComment.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:from-violet-600 hover:to-purple-600 font-medium text-sm disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post Comment
            </button>
          </div>
        </div>

        {/* Comments list */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading discussion...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {discussions.map(discussion => (
              <Comment
                key={discussion.id}
                comment={discussion}
                billId={billId}
                onReplyPosted={fetchDiscussions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

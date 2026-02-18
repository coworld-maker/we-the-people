'use client'

import { useState } from 'react'

interface VotingPanelProps {
  billId: string
  currentVote?: { position: string; reasoning?: string }
}

export default function VotingPanel({ billId, currentVote }: VotingPanelProps) {
  const [position, setPosition] = useState(currentVote?.position || '')
  const [reasoning, setReasoning] = useState(currentVote?.reasoning || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!currentVote)
  const [error, setError] = useState('')

  async function handleVote() {
    if (!position) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, position, reasoning }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Vote failed') }
      setSubmitted(true)
    } catch (err: any) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const votes = [
    { value: 'yes', emoji: '✅', label: 'Yes', desc: 'Support this bill', active: 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200', btn: 'from-emerald-500 to-green-500 shadow-emerald-200' },
    { value: 'no', emoji: '❌', label: 'No', desc: 'Oppose this bill', active: 'border-red-400 bg-red-50 ring-2 ring-red-200', btn: 'from-red-500 to-rose-500 shadow-red-200' },
    { value: 'abstain', emoji: '⏭️', label: 'Abstain', desc: 'Skip this one', active: 'border-gray-400 bg-gray-50 ring-2 ring-gray-200', btn: 'from-gray-500 to-slate-500 shadow-gray-200' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-[#FF6B6B] to-[#E85D5D] px-6 py-4">
        <h3 className="font-display text-lg font-bold text-white">🗳️ Cast Your Vote</h3>
      </div>
      <div className="p-6">
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">{position === 'yes' ? '✅' : position === 'no' ? '❌' : '⏭️'}</div>
            <p className="font-display font-bold text-[#0F172A] text-lg">Vote Recorded!</p>
            <p className="text-sm text-gray-400 mt-1 font-body">You voted <span className="font-semibold capitalize">{position}</span></p>
            <button onClick={() => { setSubmitted(false) }} className="mt-4 text-xs font-semibold text-[#6366F1] hover:text-[#4F46E5] transition-colors">
              Change Vote
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {votes.map(v => (
                <button key={v.value} onClick={() => setPosition(v.value)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    position === v.value ? v.active : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <span className="text-xl">{v.emoji}</span>
                  <div>
                    <p className="font-display font-bold text-[#0F172A] text-sm">{v.label}</p>
                    <p className="text-xs text-gray-400 font-body">{v.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <textarea
              value={reasoning} onChange={(e) => setReasoning(e.target.value)}
              placeholder="Why? (optional)" rows={2} maxLength={500}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] resize-none text-[#0F172A] placeholder-gray-400 bg-gray-50/50 font-body mb-4"
            />

            {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">⚠️ {error}</p>}

            <button onClick={handleVote} disabled={!position || submitting}
              className={`w-full py-3 rounded-xl font-display font-bold text-white text-sm transition-all disabled:opacity-40 bg-gradient-to-r ${
                position ? (votes.find(v => v.value === position)?.btn || 'from-gray-500 to-gray-600') : 'from-gray-300 to-gray-400'
              } shadow-lg hover:-translate-y-0.5 hover:shadow-xl`}
            >
              {submitting ? '⏳ Submitting...' : position ? `Vote ${position.charAt(0).toUpperCase() + position.slice(1)}` : 'Select an option'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

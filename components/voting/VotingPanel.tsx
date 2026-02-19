'use client'

import { useState } from 'react'
import { Check, X, MinusCircle } from 'lucide-react'
import Confetti from '@/components/ui/Confetti'

interface Props {
  billId: string
  currentVote?: { position: string; reasoning?: string }
}

export default function VotingPanel({ billId, currentVote }: Props) {
  const [position, setPosition] = useState(currentVote?.position || '')
  const [reasoning, setReasoning] = useState(currentVote?.reasoning || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!currentVote)
  const [error, setError] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)

  async function handleVote() {
    if (!position) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ billId, position, reasoning }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Vote failed') }
      setSubmitted(true)
      if (!currentVote) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
      }
    } catch (err: any) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const options = [
    { value: 'yes', label: 'Yes — Support', icon: Check, activeClass: 'border-emerald-500 bg-emerald-50', btnClass: 'bg-emerald-600 hover:bg-emerald-700', iconActive: 'text-emerald-600' },
    { value: 'no', label: 'No — Oppose', icon: X, activeClass: 'border-red-500 bg-red-50', btnClass: 'bg-red-600 hover:bg-red-700', iconActive: 'text-red-600' },
    { value: 'abstain', label: 'Abstain', icon: MinusCircle, activeClass: 'border-gray-400 bg-gray-50', btnClass: 'bg-gray-600 hover:bg-gray-700', iconActive: 'text-gray-600' },
  ]

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="card overflow-hidden">
        <div className="bg-[--accent] px-6 py-4">
          <h3 className="font-display text-sm font-bold text-white">Cast your vote</h3>
        </div>
        <div className="p-5">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-[--accent-light]">
                <Check className="w-6 h-6 text-[--accent]" />
              </div>
              <p className="font-display font-bold text-[--text] text-lg">Vote recorded</p>
              <p className="text-sm text-[--text-muted] mt-1">You voted <span className="font-semibold capitalize text-[--text]">{position}</span></p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-xs font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
                Change vote
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {options.map(o => (
                  <button key={o.value} onClick={() => setPosition(o.value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all text-left ${
                      position === o.value ? o.activeClass : 'border-[--border] hover:border-gray-300'
                    }`}
                  >
                    <o.icon className={`w-4 h-4 transition-colors ${position === o.value ? o.iconActive : 'text-[--text-muted]'}`} />
                    <span className="text-sm font-medium text-[--text]">{o.label}</span>
                  </button>
                ))}
              </div>
              <textarea value={reasoning} onChange={e => setReasoning(e.target.value)}
                placeholder="Your reasoning (optional)" rows={2} maxLength={500}
                className="w-full px-3 py-2.5 border border-[--border] rounded-lg text-sm resize-none text-[--text] placeholder-[--text-muted] focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none mb-3"
              />
              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
              <button onClick={handleVote} disabled={!position || submitting}
                className={`w-full py-3 rounded-lg font-semibold text-white text-sm transition-all disabled:opacity-40 ${
                  position ? (options.find(o => o.value === position)?.btnClass || 'bg-gray-500') : 'bg-gray-300'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...
                  </span>
                ) : position ? `Vote ${position.charAt(0).toUpperCase() + position.slice(1)}` : 'Select a position'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react'

interface VotingPanelProps {
  billId: string
  currentVote?: {
    position: string
    reasoning?: string
  }
}

export default function VotingPanel({ billId, currentVote }: VotingPanelProps) {
  const [position, setPosition] = useState<'yes' | 'no' | 'abstain' | null>(
    currentVote ? (currentVote.position as any) : null
  )
  const [reasoning, setReasoning] = useState(currentVote?.reasoning || '')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleVote = async () => {
    if (!position) {
      setMessage({ type: 'error', text: 'Please select a position' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId,
          position,
          reasoning: reasoning.trim() || undefined,
          isAnonymous,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cast vote')
      }

      setMessage({ type: 'success', text: 'Vote cast successfully!' })
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to cast vote' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Cast Your Vote
      </h3>

      {/* Position Selection */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setPosition('yes')}
          disabled={isSubmitting}
          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
            position === 'yes'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center gap-2">
            <ThumbsUp className={position === 'yes' ? 'text-green-600' : 'text-gray-600'} />
            <span className={`font-medium ${position === 'yes' ? 'text-green-700' : 'text-gray-700'}`}>
              Yes
            </span>
          </span>
          {position === 'yes' && (
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setPosition('no')}
          disabled={isSubmitting}
          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
            position === 'no'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center gap-2">
            <ThumbsDown className={position === 'no' ? 'text-red-600' : 'text-gray-600'} />
            <span className={`font-medium ${position === 'no' ? 'text-red-700' : 'text-gray-700'}`}>
              No
            </span>
          </span>
          {position === 'no' && (
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setPosition('abstain')}
          disabled={isSubmitting}
          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
            position === 'abstain'
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center gap-2">
            <MinusCircle className={position === 'abstain' ? 'text-gray-600' : 'text-gray-400'} />
            <span className={`font-medium ${position === 'abstain' ? 'text-gray-700' : 'text-gray-600'}`}>
              Abstain
            </span>
          </span>
          {position === 'abstain' && (
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Reasoning */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reasoning (Optional)
        </label>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          disabled={isSubmitting}
          placeholder="Explain your position..."
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          {reasoning.length}/500 characters
        </p>
      </div>

      {/* Privacy Option */}
      <div className="mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Keep my vote anonymous
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleVote}
        disabled={!position || isSubmitting}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : currentVote ? 'Update Vote' : 'Cast Vote'}
      </button>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

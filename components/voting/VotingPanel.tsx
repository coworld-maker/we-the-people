'use client'

import { useState, useEffect } from 'react'
import { Check, X, MinusCircle, Phone, Copy, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import Confetti from '@/components/ui/Confetti'
import ShareButton from '@/components/ui/ShareButton'
import SocialShare from '@/components/ui/SocialShare'

interface CommunityStats {
  yesCount: number
  noCount: number
  abstainCount: number
  totalVotes: number
}

interface Props {
  billId: string
  billTitle?: string
  currentVote?: { position: string; reasoning?: string }
  communityStats?: CommunityStats
}

const OPTIONS = [
  {
    value: 'yes',
    label: 'Support',
    icon: Check,
    selectedCard: 'border-emerald-500 bg-emerald-50',
    submitBtn: 'bg-emerald-600 hover:bg-emerald-700',
    iconColor: 'text-emerald-600',
    barColor: 'bg-emerald-500',
  },
  {
    value: 'no',
    label: 'Oppose',
    icon: X,
    selectedCard: 'border-red-500 bg-red-50',
    submitBtn: 'bg-red-600 hover:bg-red-700',
    iconColor: 'text-red-600',
    barColor: 'bg-red-500',
  },
  {
    value: 'abstain',
    label: 'Abstain',
    icon: MinusCircle,
    selectedCard: 'border-[--border-medium] bg-[--surface-secondary]',
    submitBtn: 'bg-[--text-secondary] hover:bg-[--text]',
    iconColor: 'text-[--text-muted]',
    barColor: 'bg-[--surface-tertiary]',
  },
]

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

function buildLetter(position: string, billTitle: string) {
  const stance =
    position === 'yes' ? 'support' : position === 'no' ? 'oppose' : 'abstain on'
  return `Dear Representative,

I am writing as your constituent to let you know that I ${stance} the following legislation: "${billTitle}".

As someone who cares about how this bill affects our community, I urge you to consider the views of the citizens you represent when this bill comes before you.

Thank you for your service.

A concerned constituent`
}

// ── Contact your rep panel — buttons always visible, letter collapsible ──────
function ContactPanel({ position, billTitle }: { position: string; billTitle: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const letter = buildLetter(position, billTitle)

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  return (
    <div className="mt-3 p-3.5 bg-[--surface-secondary] rounded-xl border border-[--border]">
      <p className="text-xs font-semibold text-[--text] mb-2.5">📬 Let your rep know</p>
      <div className="flex gap-2 mb-2">
        <button
          onClick={copyLetter}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-[--accent] text-white hover:bg-[--accent-hover] transition-colors"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5" /> Copied!</>
            : <><Copy className="w-3.5 h-3.5" /> Copy letter</>
          }
        </button>
        <a
          href="tel:+12026243121"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[--border] bg-[--surface] text-[--text-secondary] hover:border-[--accent]/40 hover:text-[--accent] transition-colors"
          title="Capitol Switchboard"
        >
          <Phone className="w-3.5 h-3.5" /> Call
        </a>
        <a
          href="/action-center"
          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border border-[--border] bg-[--surface] text-[--text-secondary] hover:border-[--accent]/40 hover:text-[--accent] transition-colors"
          title="Full Action Center"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[10px] text-[--text-muted] hover:text-[--text] transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? 'Hide' : 'View'} draft letter
      </button>
      {open && (
        <div className="mt-2 bg-[--surface] border border-[--border] rounded-lg p-3 text-[11px] text-[--text-secondary] whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto font-mono">
          {letter}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function VotingPanel({ billId, billTitle, currentVote, communityStats }: Props) {
  const [position, setPosition] = useState(currentVote?.position ?? '')
  const [reasoning, setReasoning] = useState(currentVote?.reasoning ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!currentVote)
  const [error, setError] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [pageUrl, setPageUrl] = useState('')

  const [liveStats, setLiveStats] = useState<CommunityStats | null>(communityStats ?? null)

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

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
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Vote failed')
      }

      if (liveStats) {
        const prev = currentVote?.position
        const updated = {
          yesCount:     liveStats.yesCount     + (position === 'yes'     ? 1 : 0) - (prev === 'yes'     ? 1 : 0),
          noCount:      liveStats.noCount      + (position === 'no'      ? 1 : 0) - (prev === 'no'      ? 1 : 0),
          abstainCount: liveStats.abstainCount + (position === 'abstain' ? 1 : 0) - (prev === 'abstain' ? 1 : 0),
          totalVotes:   liveStats.totalVotes   + (prev ? 0 : 1),
        }
        setLiveStats(updated)
      }

      setSubmitted(true)
      if (!currentVote) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const chosenOption = OPTIONS.find(o => o.value === position)
  const total = liveStats?.totalVotes ?? 0
  const shareText = position && billTitle
    ? `I voted to ${position === 'yes' ? 'support' : position === 'no' ? 'oppose' : 'abstain on'} "${billTitle}" on Democracy Unlocked. See the bill and cast your vote:`
    : 'Check out this bill on Democracy Unlocked:'

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="card overflow-hidden" id="vote">
        <div className="bg-[--accent] px-5 py-3.5 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-white">Cast your vote</h3>
          {submitted && pageUrl && (
            <ShareButton
              url={pageUrl}
              title={billTitle ?? 'Bill on Democracy Unlocked'}
              text={shareText}
              label="Share"
              variant="pill"
              className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 hover:!border-white/30"
            />
          )}
        </div>

        <div className="p-5">
          {submitted ? (
            <div>
              {/* Chosen position */}
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border-2 mb-4 ${chosenOption?.selectedCard ?? 'border-[--border]'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  position === 'yes' ? 'bg-emerald-100' : position === 'no' ? 'bg-red-100' : 'bg-[--surface-tertiary]'
                }`}>
                  {chosenOption && <chosenOption.icon className={`w-4 h-4 ${chosenOption.iconColor}`} />}
                </div>
                <div>
                  <p className="text-xs text-[--text-muted] font-medium uppercase tracking-wide">Your vote</p>
                  <p className="text-sm font-bold text-[--text] capitalize">{chosenOption?.label ?? position}</p>
                </div>
                <Check className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
              </div>

              {/* Community breakdown */}
              {liveStats && total > 0 && (
                <div className="space-y-2.5 mb-4">
                  <p className="text-xs font-semibold text-[--text-muted] uppercase tracking-wide">
                    Community · {total.toLocaleString()} vote{total !== 1 ? 's' : ''}
                  </p>
                  {OPTIONS.map(o => {
                    const count = o.value === 'yes' ? liveStats.yesCount : o.value === 'no' ? liveStats.noCount : liveStats.abstainCount
                    const p = pct(count, total)
                    const isYours = o.value === position
                    return (
                      <div key={o.value}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${isYours ? 'text-[--text]' : 'text-[--text-secondary]'}`}>
                            {o.label} {isYours && '← you'}
                          </span>
                          <span className={`text-xs font-semibold ${isYours ? 'text-[--text]' : 'text-[--text-muted]'}`}>
                            {p}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[--surface-tertiary] overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ${isYours ? o.barColor : ''}`}
                            style={{ width: `${p}%`, background: isYours ? undefined : '#CBD5E1' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Post-vote action */}
              {billTitle && <ContactPanel position={position} billTitle={billTitle} />}

              {/* Share your vote — the growth loop the AI-summary clones can't run */}
              {pageUrl && (
                <div className="mt-4 p-3.5 rounded-xl bg-[--accent-light] border border-[--accent]/15">
                  <p className="text-xs font-bold text-[--text] mb-0.5">Share your vote</p>
                  <p className="text-[11px] text-[--text-muted] mb-2.5">
                    Bring someone else into the conversation — every share grows the community.
                  </p>
                  <SocialShare url={pageUrl} text={shareText} context="vote" />
                </div>
              )}

              <button
                onClick={() => setSubmitted(false)}
                className="w-full mt-3 text-xs font-semibold text-[--text-secondary] hover:text-[--accent] transition-colors py-2 border border-[--border] rounded-lg hover:border-[--accent]/30"
              >
                Change vote
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setPosition(o.value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                      position === o.value ? o.selectedCard : 'border-[--border] hover:border-[--border-medium]'
                    }`}
                  >
                    <o.icon className={`w-4 h-4 transition-colors shrink-0 ${position === o.value ? o.iconColor : 'text-[--text-muted]'}`} />
                    <span className="text-sm font-medium text-[--text]">{o.label}</span>
                    {position === o.value && (
                      <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-[--accent]" />
                    )}
                  </button>
                ))}
              </div>

              <textarea
                value={reasoning}
                onChange={e => setReasoning(e.target.value)}
                placeholder="Your reasoning (optional)"
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2.5 border border-[--border] rounded-lg text-sm resize-none text-[--text] placeholder-[--text-muted] focus:ring-2 focus:ring-[--accent] focus:border-[--accent] outline-none mb-3"
              />

              {error && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3 border border-red-100">
                  {error}
                </p>
              )}

              <button
                onClick={handleVote}
                disabled={!position || submitting}
                className={`w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  chosenOption ? chosenOption.submitBtn : 'bg-[--surface-tertiary]'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : position ? (
                  `Vote — ${chosenOption?.label}`
                ) : (
                  'Select a position'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
